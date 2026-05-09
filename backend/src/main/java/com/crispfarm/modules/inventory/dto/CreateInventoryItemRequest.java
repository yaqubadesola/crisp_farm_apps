package com.crispfarm.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateInventoryItemRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotBlank String unit,
        BigDecimal reorderLevel
) {}
