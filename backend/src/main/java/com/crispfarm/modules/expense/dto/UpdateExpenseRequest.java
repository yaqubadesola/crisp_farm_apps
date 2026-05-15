package com.crispfarm.modules.expense.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateExpenseRequest(
        String category,
        BigDecimal amount,
        LocalDate expenseDate,
        String description,
        Long cycleId
) {}
