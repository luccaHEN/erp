package com.erpflow.dashboard.dto;

import java.math.BigDecimal;

public record TopProductDTO(
        Long productId,
        String productName,
        String productSku,
        BigDecimal quantitySold,
        BigDecimal totalRevenue
) {}
