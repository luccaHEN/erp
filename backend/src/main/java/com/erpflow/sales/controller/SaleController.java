package com.erpflow.sales.controller;

import com.erpflow.sales.domain.SaleStatus;
import com.erpflow.sales.dto.CancelSaleRequest;
import com.erpflow.sales.dto.SaleCreateRequest;
import com.erpflow.sales.dto.SaleResponse;
import com.erpflow.sales.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/sales")
@Tag(name = "Vendas (PDV)", description = "Emissão de pedidos, controle de vendas, baixa de estoque e geração de títulos financeiros")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    @Operation(summary = "Listar vendas", description = "Lista paginada de vendas com filtros por status, cliente, período e busca")
    public ResponseEntity<Page<SaleResponse>> search(
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @PageableDefault(size = 15, sort = "saleDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(saleService.search(status, customerId, search, startDate, endDate, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar venda por ID", description = "Retorna os detalhes completos da venda com todos os seus itens")
    public ResponseEntity<SaleResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Criar nova venda", description = "Gera orçamento ou confirmação direta com recálculo seguro no backend")
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(saleService.create(request));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirmar venda", description = "Transação atômica: baixa estoque e gera títulos a receber")
    public ResponseEntity<SaleResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.confirm(id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancelar venda", description = "Transação atômica: estorna estoque e cancela títulos a receber")
    public ResponseEntity<SaleResponse> cancel(@PathVariable Long id, @Valid @RequestBody CancelSaleRequest request) {
        return ResponseEntity.ok(saleService.cancel(id, request));
    }
}
