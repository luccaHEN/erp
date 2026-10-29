package com.erpflow.dashboard.controller;

import com.erpflow.dashboard.dto.DashboardOverviewResponse;
import com.erpflow.dashboard.dto.SalesByPeriodDTO;
import com.erpflow.dashboard.dto.TopProductDTO;
import com.erpflow.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Indicadores em tempo real, rankings e séries temporais")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Visão geral dos KPIs", description = "Retorna receita do mês, contagem de vendas, contas a pagar/receber e alerta de estoque")
    public ResponseEntity<DashboardOverviewResponse> getOverview() {
        return ResponseEntity.ok(dashboardService.getOverview());
    }

    @GetMapping("/sales-chart")
    @Operation(summary = "Evolução de vendas diárias", description = "Retorna histórico de vendas agrupado por dia para gráficos")
    public ResponseEntity<List<SalesByPeriodDTO>> getSalesChart(
            @RequestParam(defaultValue = "14") int days
    ) {
        return ResponseEntity.ok(dashboardService.getSalesChart(Math.min(days, 90)));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Produtos mais vendidos", description = "Retorna ranking dos produtos com maior faturamento")
    public ResponseEntity<List<TopProductDTO>> getTopProducts(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(dashboardService.getTopProducts(Math.min(limit, 20)));
    }
}
