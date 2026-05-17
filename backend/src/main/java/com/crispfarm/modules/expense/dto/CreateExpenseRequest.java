package com.crispfarm.modules.expense.dto;

import com.crispfarm.modules.expense.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateExpenseRequest(
        @NotNull ExpenseCategory category,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotNull LocalDate expenseDate,
        String description,
        @NotNull(message = "Cycle is required") Long cycleId
) {}
