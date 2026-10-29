package com.erpflow.gestao;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GestaoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@erpflow.com", "admin123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        adminToken = response.getAccessToken();
    }

    @Test
    @DisplayName("Deve consultar KPIs do dashboard com dados reais consolidados")
    void testDashboardOverview() throws Exception {
        mockMvc.perform(get("/api/dashboard/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyRevenue").exists())
                .andExpect(jsonPath("$.monthlySalesCount").exists())
                .andExpect(jsonPath("$.pendingReceivables").exists())
                .andExpect(jsonPath("$.pendingPayables").exists())
                .andExpect(jsonPath("$.lowStockCount").exists());
    }

    @Test
    @DisplayName("Deve consultar evolução de vendas diárias e top produtos")
    void testDashboardCharts() throws Exception {
        mockMvc.perform(get("/api/dashboard/sales-chart?days=7")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/dashboard/top-products?limit=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Deve exportar relatórios em formato CSV com headers de anexo e proteção de charset")
    void testReportsCsvExport() throws Exception {
        // Vendas CSV
        mockMvc.perform(get("/api/reports/sales/csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"relatorio-vendas.csv\""))
                .andExpect(content().contentType("text/csv;charset=UTF-8"));

        // Estoque CSV
        mockMvc.perform(get("/api/reports/inventory/csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"relatorio-estoque.csv\""))
                .andExpect(content().contentType("text/csv;charset=UTF-8"));

        // Financeiro CSV
        mockMvc.perform(get("/api/reports/financial/csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"relatorio-financial.csv\"".replace("financial", "financeiro")))
                .andExpect(content().contentType("text/csv;charset=UTF-8"));
    }

    @Test
    @DisplayName("Deve listar trilha de auditoria para ADMIN e bloquear acesso anônimo")
    void testAuditSecurity() throws Exception {
        // Bloqueio anônimo
        mockMvc.perform(get("/api/audit"))
                .andExpect(status().isForbidden());

        // Acesso com ADMIN
        mockMvc.perform(get("/api/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
