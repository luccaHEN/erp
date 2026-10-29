package com.erpflow.auth;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
import com.erpflow.auth.dto.UserProfileResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Deve autenticar com sucesso o admin padrão e retornar token JWT")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@erpflow.com", "admin123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("admin@erpflow.com"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.companyId").value(1))
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        assertThat(response.getAccessToken()).isNotBlank();

        // Agora testa /api/auth/me usando o token gerado
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + response.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@erpflow.com"))
                .andExpect(jsonPath("$.companyName").isNotEmpty());
    }

    @Test
    @DisplayName("Deve rejeitar login com senha incorreta retornando HTTP 401")
    void shouldRejectInvalidPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@erpflow.com", "senha_errada");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("E-mail ou senha incorretos."));
    }

    @Test
    @DisplayName("Deve rejeitar requisição protegida sem token JWT retornando HTTP 403")
    void shouldRejectUnauthorizedRequestWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }
}
