package com.erpflow.operacoes;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
import com.erpflow.financial.domain.PaymentMethod;
import com.erpflow.inventory.domain.StockMovementType;
import com.erpflow.inventory.dto.StockMovementRequest;
import com.erpflow.product.dto.ProductRequest;
import com.erpflow.product.dto.ProductResponse;
import com.erpflow.sales.dto.CancelSaleRequest;
import com.erpflow.sales.dto.SaleCreateRequest;
import com.erpflow.sales.dto.SaleItemRequest;
import com.erpflow.sales.dto.SaleResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OperacoesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setup() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@erpflow.com", "admin123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        this.adminToken = response.getAccessToken();
    }

    private ProductResponse createTestProduct(BigDecimal initialStock) throws Exception {
        String uniqueSku = "SKU-OP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ProductRequest productRequest = new ProductRequest();
        productRequest.setName("Mouse Gamer RGB 16k DPI");
        productRequest.setSku(uniqueSku);
        productRequest.setUnit("UN");
        productRequest.setCostPrice(new BigDecimal("50.00"));
        productRequest.setSalePrice(new BigDecimal("100.00"));
        productRequest.setMinStock(new BigDecimal("2.000"));
        productRequest.setActive(true);

        MvcResult prodResult = mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        ProductResponse product = objectMapper.readValue(prodResult.getResponse().getContentAsString(), ProductResponse.class);

        // Se solicitado estoque inicial, registra entrada de estoque
        if (initialStock.compareTo(BigDecimal.ZERO) > 0) {
            StockMovementRequest movementRequest = new StockMovementRequest();
            movementRequest.setProductId(product.getId());
            movementRequest.setType(StockMovementType.ENTRADA);
            movementRequest.setQuantity(initialStock);
            movementRequest.setReason("Carga de estoque de teste");

            mockMvc.perform(post("/api/inventory/movements")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(movementRequest)))
                    .andExpect(status().isCreated());
        }

        return product;
    }

    @Test
    @DisplayName("Deve registrar entrada de estoque com sucesso")
    void shouldRegisterStockEntry() throws Exception {
        ProductResponse product = createTestProduct(BigDecimal.ZERO);

        StockMovementRequest movement = new StockMovementRequest();
        movement.setProductId(product.getId());
        movement.setType(StockMovementType.ENTRADA);
        movement.setQuantity(new BigDecimal("15.000"));
        movement.setUnitCost(new BigDecimal("52.00"));
        movement.setReason("Nota Fiscal 9999");

        mockMvc.perform(post("/api/inventory/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(movement)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("ENTRADA"))
                .andExpect(jsonPath("$.quantity").value(15.0))
                .andExpect(jsonPath("$.balanceAfter").value(15.0));

        // Verifica que o saldo do produto foi atualizado
        mockMvc.perform(get("/api/products/" + product.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStock").value(15.0));
    }

    @Test
    @DisplayName("Deve realizar fluxo completo de Venda: Criar -> Confirmar -> Baixar Estoque -> Gerar Financeiro")
    void shouldCompleteFullSaleFlow() throws Exception {
        ProductResponse product = createTestProduct(new BigDecimal("10.000"));

        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(product.getId());
        item.setQuantity(new BigDecimal("3.000"));
        item.setDiscount(BigDecimal.ZERO);

        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setPaymentMethod(PaymentMethod.PIX);
        saleRequest.setDiscount(BigDecimal.ZERO);
        saleRequest.setItems(List.of(item));
        saleRequest.setConfirmImmediately(false);

        // 1. Cria Orçamento
        MvcResult saleResult = mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ORCAMENTO"))
                .andExpect(jsonPath("$.totalAmount").value(300.0))
                .andReturn();

        SaleResponse sale = objectMapper.readValue(saleResult.getResponse().getContentAsString(), SaleResponse.class);

        // 2. Confirma Venda
        mockMvc.perform(post("/api/sales/" + sale.getId() + "/confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADA"));

        // 3. Verifica que o estoque baixou de 10 para 7
        mockMvc.perform(get("/api/products/" + product.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStock").value(7.0));

        // 4. Verifica que foi gerado título financeiro de R$ 300
        mockMvc.perform(get("/api/financial")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("type", "RECEBER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.amount == 300.0)]").exists());
    }

    @Test
    @DisplayName("Deve rejeitar confirmação de venda se o estoque for insuficiente")
    void shouldBlockSaleWithoutStock() throws Exception {
        ProductResponse product = createTestProduct(new BigDecimal("2.000"));

        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(product.getId());
        item.setQuantity(new BigDecimal("5.000")); // Solicita mais do que os 2 disponíveis

        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setPaymentMethod(PaymentMethod.DINHEIRO);
        saleRequest.setItems(List.of(item));
        saleRequest.setConfirmImmediately(false);

        MvcResult saleResult = mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        SaleResponse sale = objectMapper.readValue(saleResult.getResponse().getContentAsString(), SaleResponse.class);

        // Tentativa de confirmação deve falhar com HTTP 400
        mockMvc.perform(post("/api/sales/" + sale.getId() + "/confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Estoque insuficiente")));
    }

    @Test
    @DisplayName("Deve cancelar venda confirmada, estornando estoque e cancelando financeiro")
    void shouldCancelSaleAndRevertStock() throws Exception {
        ProductResponse product = createTestProduct(new BigDecimal("10.000"));

        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(product.getId());
        item.setQuantity(new BigDecimal("4.000"));

        SaleCreateRequest saleRequest = new SaleCreateRequest();
        saleRequest.setPaymentMethod(PaymentMethod.BOLETO);
        saleRequest.setItems(List.of(item));
        saleRequest.setConfirmImmediately(true); // Confirma direto

        MvcResult saleResult = mockMvc.perform(post("/api/sales")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saleRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMADA"))
                .andReturn();

        SaleResponse sale = objectMapper.readValue(saleResult.getResponse().getContentAsString(), SaleResponse.class);

        // Estoque após venda confirmada = 6
        mockMvc.perform(get("/api/products/" + product.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStock").value(6.0));

        // Cancela a venda com justificativa
        CancelSaleRequest cancelReq = new CancelSaleRequest("Desistência do cliente antes da entrega");
        mockMvc.perform(post("/api/sales/" + sale.getId() + "/cancel")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADA"));

        // Estoque deve ter voltado para 10!
        mockMvc.perform(get("/api/products/" + product.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStock").value(10.0));
    }
}
