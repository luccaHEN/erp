package com.erpflow.inventory.controller;

import com.erpflow.inventory.domain.StockMovementType;
import com.erpflow.inventory.dto.StockMovementRequest;
import com.erpflow.inventory.dto.StockMovementResponse;
import com.erpflow.inventory.service.InventoryService;
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
@RequestMapping("/api/inventory")
@Tag(name = "Estoque", description = "Controle de saldo, entradas, saídas e extrato imutável de movimentações")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/movements")
    @Operation(summary = "Consultar extrato de movimentações", description = "Lista paginada de movimentações com filtros por produto e tipo de operação")
    public ResponseEntity<Page<StockMovementResponse>> searchMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType type,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(inventoryService.search(productId, type, pageable));
    }

    @PostMapping("/movements")
    @Operation(summary = "Registrar movimentação de estoque", description = "Executa entrada, saída manual ou ajuste com travamento concorrente no produto")
    public ResponseEntity<StockMovementResponse> registerMovement(@Valid @RequestBody StockMovementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.registerMovement(request));
    }
}
