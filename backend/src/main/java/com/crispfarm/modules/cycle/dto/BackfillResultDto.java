package com.crispfarm.modules.cycle.dto;

public record BackfillResultDto(
        Long cycleId,
        String cycleName,
        int expensesUpdated,
        int salesUpdated,
        int inventoryTransactionsUpdated,
        int totalUpdated
) {}
