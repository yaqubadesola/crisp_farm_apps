package com.crispfarm.modules.sales.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSaleRequest(
        @NotNull(message = "Customer is required") Long customerId,
        @NotNull @DecimalMin("0.001") BigDecimal quantityKg,
        @NotBlank String paymentMethod,
        @NotNull(message = "Cycle is required") Long cycleId,
        LocalDate dueDate,
        String notes,
        String pricingTierName
) {}
