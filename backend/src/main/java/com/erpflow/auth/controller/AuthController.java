package com.erpflow.auth.controller;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
import com.erpflow.auth.dto.UserProfileResponse;
import com.erpflow.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Endpoints de login e consulta de sessão do usuário")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Realizar login", description = "Autentica usuário com e-mail e senha, retornando o token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Consultar usuário autenticado", description = "Retorna os dados do perfil e da empresa do usuário logado via JWT")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        UserProfileResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(response);
    }
}
