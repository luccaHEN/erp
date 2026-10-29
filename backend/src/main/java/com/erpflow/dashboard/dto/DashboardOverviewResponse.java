package com.erpflow.dashboard.dto;

import java.math.BigDecimal;

public record DashboardOverviewResponse(
        BigDecimal monthlyRevenue,
        Long monthlySalesCount,
        BigDecimal pendingReceivables,
        BigDecimal pendingPayables,
        Long lowStockCount
) {}
