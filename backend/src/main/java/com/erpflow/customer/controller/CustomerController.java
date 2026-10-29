package com.erpflow.customer.controller;

import com.erpflow.customer.dto.CustomerRequest;
import com.erpflow.customer.dto.CustomerResponse;
import com.erpflow.customer.service.CustomerService;
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
@RequestMapping("/api/customers")
@Tag(name = "Clientes", description = "Gestão de carteira de clientes")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "Listar clientes", description = "Lista paginada de clientes com filtros por nome/documento e status")
    public ResponseEntity<Page<CustomerResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 15, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(customerService.search(search, active, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar cliente por ID", description = "Retorna os detalhes de um cliente da empresa")
    public ResponseEntity<CustomerResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar cliente", description = "Cadastra um novo cliente validando unicidade de CPF/CNPJ dentro da empresa")
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar cliente", description = "Atualiza os dados de um cliente existente")
    public ResponseEntity<CustomerResponse> update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Ativar ou inativar cliente", description = "Alterna a situação cadastral do cliente")
    public ResponseEntity<CustomerResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.toggleStatus(id));
    }
}
