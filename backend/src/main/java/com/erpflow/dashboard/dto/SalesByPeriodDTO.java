package com.erpflow.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SalesByPeriodDTO(
        LocalDate date,
        BigDecimal totalAmount,
        Long salesCount
) {}
