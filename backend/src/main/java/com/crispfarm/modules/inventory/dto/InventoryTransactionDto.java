package com.crispfarm.modules.inventory.dto;

import com.crispfarm.modules.inventory.InventoryTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record InventoryTransactionDto(
        Long id,
        Long itemId,
        String itemName,
        String transactionType,
        BigDecimal quantity,
        String unit,
        BigDecimal unitCost,
        BigDecimal totalCost,
        Long cycleId,
        String notes,
        LocalDate transactionDate,
        String recordedBy,
        LocalDateTime createdAt
) {
    public static InventoryTransactionDto from(InventoryTransaction t, String itemName, String unit) {
        return new InventoryTransactionDto(
                t.getId(), t.getItemId(), itemName, t.getTransactionType(),
                t.getQuantity(), unit, t.getUnitCost(), t.getTotalCost(),
                t.getCycleId(), t.getNotes(), t.getTransactionDate(),
                t.getRecordedBy(), t.getCreatedAt()
        );
    }
}
