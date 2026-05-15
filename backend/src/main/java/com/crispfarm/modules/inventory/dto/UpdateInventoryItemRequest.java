package com.crispfarm.modules.inventory.dto;

import java.math.BigDecimal;

public record UpdateInventoryItemRequest(
        String name,
        String category,
        String unit,
        BigDecimal reorderLevel
) {}
