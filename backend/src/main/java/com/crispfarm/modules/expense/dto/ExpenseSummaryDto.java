package com.crispfarm.modules.expense.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ExpenseSummaryDto(
        BigDecimal totalAmount,
        Map<String, BigDecimal> byCategory
) {}
