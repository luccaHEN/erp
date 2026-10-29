package com.erpflow.cadastros;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
import com.erpflow.customer.dto.CustomerRequest;
import com.erpflow.product.dto.ProductRequest;
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
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CadastrosIntegrationTest {

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

    @Test
    @DisplayName("Deve cadastrar cliente e impedir documento duplicado na mesma empresa")
    void shouldCreateCustomerAndBlockDuplicateDocument() throws Exception {
        String uniqueDoc = "DOC-" + UUID.randomUUID().toString().substring(0, 10);
        CustomerRequest customerRequest = new CustomerRequest();
        customerRequest.setName("Cliente Teste Unitário");
        customerRequest.setDocument(uniqueDoc);
        customerRequest.setEmail("cliente." + UUID.randomUUID().toString().substring(0, 8) + "@empresa.com");
        customerRequest.setPhone("(11) 98888-7777");
        customerRequest.setActive(true);

        // Primeiro cadastro deve ter sucesso HTTP 201
        mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Cliente Teste Unitário"))
                .andExpect(jsonPath("$.document").value(uniqueDoc));

        // Segundo cadastro com o mesmo documento deve ser rejeitado com HTTP 400
        mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Já existe um cliente cadastrado com este documento nesta empresa."));
    }

    @Test
    @DisplayName("Deve cadastrar produto e impedir SKU duplicado na mesma empresa")
    void shouldCreateProductAndBlockDuplicateSku() throws Exception {
        String uniqueSku = "SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ProductRequest productRequest = new ProductRequest();
        productRequest.setName("Produto Teste Unitário");
        productRequest.setSku(uniqueSku);
        productRequest.setUnit("UN");
        productRequest.setCostPrice(new BigDecimal("120.50"));
        productRequest.setSalePrice(new BigDecimal("249.90"));
        productRequest.setMinStock(new BigDecimal("5.000"));
        productRequest.setActive(true);

        // Primeiro cadastro HTTP 201
        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.sku").value(uniqueSku))
                .andExpect(jsonPath("$.costPrice").value(120.50))
                .andExpect(jsonPath("$.salePrice").value(249.90));

        // Segundo cadastro com o mesmo SKU deve falhar HTTP 400
        mockMvc.perform(post("/api/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Já existe um produto com o SKU '" + uniqueSku + "' nesta empresa."));
    }

    @Test
    @DisplayName("Deve listar categorias da empresa com sucesso")
    void shouldListCategories() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").isNotEmpty());
    }

    @Test
    @DisplayName("Deve listar produtos, clientes e fornecedores sem filtros (paginado)")
    void shouldListPaginatedResourcesWithoutFilters() throws Exception {
        mockMvc.perform(get("/api/products")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        mockMvc.perform(get("/api/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        mockMvc.perform(get("/api/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
