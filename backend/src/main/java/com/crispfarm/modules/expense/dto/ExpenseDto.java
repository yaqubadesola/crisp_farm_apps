package com.crispfarm.modules.expense.dto;

import com.crispfarm.modules.expense.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseDto(
        Long id,
        String category,
        BigDecimal amount,
        LocalDate expenseDate,
        String description,
        Long cycleId,
        String recordedBy,
        LocalDateTime createdAt
) {
    public static ExpenseDto from(Expense e) {
        return new ExpenseDto(
                e.getId(), e.getCategory().name(), e.getAmount(),
                e.getExpenseDate(), e.getDescription(), e.getCycleId(),
                e.getRecordedBy(), e.getCreatedAt()
        );
    }
}
