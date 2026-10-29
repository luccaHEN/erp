package com.erpflow.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialReportItemDTO(
        Long id,
        String description,
        String type,
        String category,
        String relatedEntity,
        BigDecimal amount,
        LocalDate dueDate,
        LocalDate paymentDate,
        String status,
        String paymentMethod
) {}
