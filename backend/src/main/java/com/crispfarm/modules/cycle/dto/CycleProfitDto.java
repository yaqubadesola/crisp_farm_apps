package com.crispfarm.modules.cycle.dto;

import java.math.BigDecimal;

public record CycleProfitDto(
        Long cycleId,
        String cycleName,
        String status,
        Integer fingerlingCount,
        BigDecimal expectedYieldKg,
        BigDecimal actualYieldKg,
        int totalMortalities,
        double lossRatePercent,
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit,
        double roiPercent,
        long totalSalesCount
) {}
