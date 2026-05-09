package com.crispfarm.modules.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySalesReportDto(
        LocalDate date,
        long transactionCount,
        BigDecimal totalQuantityKg,
        BigDecimal totalRevenue
) {}
