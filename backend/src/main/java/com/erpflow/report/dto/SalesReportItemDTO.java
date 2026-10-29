package com.erpflow.report.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SalesReportItemDTO(
        Long saleId,
        String saleNumber,
        OffsetDateTime saleDate,
        String customerName,
        String userName,
        String paymentMethod,
        String status,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal totalAmount
) {}
