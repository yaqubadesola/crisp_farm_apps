package com.crispfarm.modules.inventory.dto;

import com.crispfarm.modules.inventory.InventoryItem;

import java.math.BigDecimal;

public record InventoryItemDto(
        Long id,
        String name,
        String category,
        BigDecimal quantityInStock,
        String unit,
        BigDecimal reorderLevel,
        boolean lowStock
) {
    public static InventoryItemDto from(InventoryItem i) {
        boolean low = i.getReorderLevel() != null
                && i.getQuantityInStock().compareTo(i.getReorderLevel()) <= 0;
        return new InventoryItemDto(
                i.getId(), i.getName(), i.getCategory(),
                i.getQuantityInStock(), i.getUnit(), i.getReorderLevel(), low
        );
    }
}
