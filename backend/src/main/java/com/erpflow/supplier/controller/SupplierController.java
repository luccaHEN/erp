package com.erpflow.supplier.controller;

import com.erpflow.supplier.dto.SupplierRequest;
import com.erpflow.supplier.dto.SupplierResponse;
import com.erpflow.supplier.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "Fornecedores", description = "Gestão de parceiros fornecedores")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Listar fornecedores", description = "Lista paginada de fornecedores com filtros por razão/fantasia/documento e status")
    public ResponseEntity<Page<SupplierResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 15, sort = "corporateName", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(supplierService.search(search, active, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar fornecedor por ID", description = "Retorna os detalhes de um fornecedor da empresa")
    public ResponseEntity<SupplierResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar fornecedor", description = "Cadastra um novo fornecedor validando documento único por empresa")
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar fornecedor", description = "Atualiza os dados cadastrais de um fornecedor")
    public ResponseEntity<SupplierResponse> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(supplierService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Ativar ou inativar fornecedor", description = "Alterna a situação cadastral do fornecedor")
    public ResponseEntity<SupplierResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.toggleStatus(id));
    }
}
