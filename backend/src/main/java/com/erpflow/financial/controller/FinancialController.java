package com.erpflow.financial.controller;

import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.financial.domain.PaymentMethod;
import com.erpflow.financial.dto.FinancialEntryRequest;
import com.erpflow.financial.dto.FinancialEntryResponse;
import com.erpflow.financial.dto.FinancialSummaryResponse;
import com.erpflow.financial.service.FinancialService;
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

import java.time.LocalDate;

@RestController
@RequestMapping("/api/financial")
@Tag(name = "Financeiro", description = "Controle de contas a pagar, contas a receber e fluxo de caixa")
public class FinancialController {

    private final FinancialService financialService;

    public FinancialController(FinancialService financialService) {
        this.financialService = financialService;
    }

    @GetMapping
    @Operation(summary = "Listar lançamentos financeiros", description = "Lista paginada com filtros por tipo (RECEBER/PAGAR), status, datas e busca")
    public ResponseEntity<Page<FinancialEntryResponse>> search(
            @RequestParam(required = false) FinancialType type,
            @RequestParam(required = false) FinancialStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 15, sort = "dueDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(financialService.search(type, status, search, startDate, endDate, pageable));
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumo financeiro", description = "Retorna totais consolidados de contas a pagar, a receber e títulos vencidos")
    public ResponseEntity<FinancialSummaryResponse> getSummary() {
        return ResponseEntity.ok(financialService.getSummary());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar título financeiro por ID", description = "Retorna os detalhes de um lançamento")
    public ResponseEntity<FinancialEntryResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(financialService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastrar lançamento financeiro", description = "Cria um novo título a pagar ou a receber")
    public ResponseEntity<FinancialEntryResponse> create(@Valid @RequestBody FinancialEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(financialService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar lançamento financeiro", description = "Atualiza valores ou datas de um título pendente")
    public ResponseEntity<FinancialEntryResponse> update(@PathVariable Long id, @Valid @RequestBody FinancialEntryRequest request) {
        return ResponseEntity.ok(financialService.update(id, request));
    }

    @PatchMapping("/{id}/settle")
    @Operation(summary = "Liquidar título (Baixa)", description = "Marca o título como PAGO com registro de data e método de pagamento")
    public ResponseEntity<FinancialEntryResponse> settle(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate paymentDate,
            @RequestParam(required = false) PaymentMethod paymentMethod
    ) {
        return ResponseEntity.ok(financialService.settle(id, paymentDate, paymentMethod));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancelar título", description = "Cancela um título pendente")
    public ResponseEntity<FinancialEntryResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(financialService.cancel(id));
    }
}
