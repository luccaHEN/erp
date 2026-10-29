package com.erpflow.report.dto;

import java.math.BigDecimal;

public record InventoryReportItemDTO(
        Long productId,
        String name,
        String sku,
        String categoryName,
        String unit,
        BigDecimal currentStock,
        BigDecimal minStock,
        BigDecimal costPrice,
        BigDecimal salePrice,
        BigDecimal totalCostValue,
        BigDecimal totalSaleValue,
        boolean lowStock
) {}
