package com.erpflow.report.controller;

import com.erpflow.financial.domain.FinancialStatus;
import com.erpflow.financial.domain.FinancialType;
import com.erpflow.report.dto.FinancialReportItemDTO;
import com.erpflow.report.dto.InventoryReportItemDTO;
import com.erpflow.report.dto.SalesReportItemDTO;
import com.erpflow.report.service.ReportService;
import com.erpflow.sales.domain.SaleStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Relatórios", description = "Relatórios analíticos e exportação em CSV com sanitização contra fórmula injection")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/sales")
    @Operation(summary = "Relatório analítico de vendas", description = "Retorna vendas em JSON conforme critérios")
    public ResponseEntity<List<SalesReportItemDTO>> getSalesReport(
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        return ResponseEntity.ok(reportService.getSalesReport(status, startDate, endDate));
    }

    @GetMapping("/sales/csv")
    @Operation(summary = "Exportar relatório de vendas em CSV", description = "Download de arquivo CSV sanitizado de vendas")
    public ResponseEntity<byte[]> exportSalesCsv(
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        byte[] csv = reportService.exportSalesToCsv(status, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio-vendas.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/inventory")
    @Operation(summary = "Relatório analítico de posição de estoque", description = "Retorna estoque e valores de custo e venda dos produtos")
    public ResponseEntity<List<InventoryReportItemDTO>> getInventoryReport(
            @RequestParam(required = false) Boolean lowStockOnly
    ) {
        return ResponseEntity.ok(reportService.getInventoryReport(lowStockOnly));
    }

    @GetMapping("/inventory/csv")
    @Operation(summary = "Exportar posição de estoque em CSV", description = "Download de arquivo CSV da posição de estoque")
    public ResponseEntity<byte[]> exportInventoryCsv(
            @RequestParam(required = false) Boolean lowStockOnly
    ) {
        byte[] csv = reportService.exportInventoryToCsv(lowStockOnly);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio-estoque.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/financial")
    @Operation(summary = "Relatório financeiro", description = "Retorna contas a pagar e a receber")
    public ResponseEntity<List<FinancialReportItemDTO>> getFinancialReport(
            @RequestParam(required = false) FinancialType type,
            @RequestParam(required = false) FinancialStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(reportService.getFinancialReport(type, status, startDate, endDate));
    }

    @GetMapping("/financial/csv")
    @Operation(summary = "Exportar relatório financeiro em CSV", description = "Download de arquivo CSV de contas financeiras")
    public ResponseEntity<byte[]> exportFinancialCsv(
            @RequestParam(required = false) FinancialType type,
            @RequestParam(required = false) FinancialStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        byte[] csv = reportService.exportFinancialToCsv(type, status, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"relatorio-financeiro.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
