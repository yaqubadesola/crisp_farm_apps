package com.crispfarm.modules.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RangeReportDto(
        LocalDate from,
        LocalDate to,
        long salesCount,
        BigDecimal totalQuantityKg,
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit
) {}
