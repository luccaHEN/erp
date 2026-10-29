package com.erpflow.company.controller;

import com.erpflow.company.dto.CompanyRequest;
import com.erpflow.company.dto.CompanyResponse;
import com.erpflow.company.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
@Tag(name = "Empresas", description = "Gestão e consulta da empresa e filiais")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping("/current")
    @Operation(summary = "Obter dados da empresa atual", description = "Retorna os detalhes da empresa do usuário logado")
    public ResponseEntity<CompanyResponse> getCurrentCompany() {
        return ResponseEntity.ok(companyService.getCurrentCompany());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar empresa por ID", description = "Retorna os dados da empresa caso pertença ao tenant autenticado")
    public ResponseEntity<CompanyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar dados da empresa", description = "Atualiza os dados cadastrais da empresa atual (exclusivo para ADMIN)")
    public ResponseEntity<CompanyResponse> update(@PathVariable Long id, @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.update(id, request));
    }
}
