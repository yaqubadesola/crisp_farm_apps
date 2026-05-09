package com.crispfarm.modules.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecordTransactionRequest(
        @NotNull Long itemId,
        @NotBlank String transactionType,
        @NotNull @DecimalMin("0.001") BigDecimal quantity,
        LocalDate transactionDate,
        BigDecimal unitCost,
        Long cycleId,
        String notes
) {}
