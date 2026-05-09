package com.crispfarm.modules.payment.dto;

import java.math.BigDecimal;
import java.util.List;

public record DebtSummaryDto(
        long totalDebtors,
        BigDecimal totalOutstanding,
        List<DebtDto> debts
) {}
