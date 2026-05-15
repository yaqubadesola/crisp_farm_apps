package com.crispfarm.modules.inventory;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.inventory.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository itemRepo;
    private final InventoryTransactionRepository txRepo;

    public List<InventoryItemDto> listItems() {
        return itemRepo.findAllByTenantIdOrderByNameAsc(TenantContext.get())
                .stream().map(InventoryItemDto::from).toList();
    }

    public List<InventoryItemDto> listLowStock() {
        return itemRepo.findLowStock(TenantContext.get())
                .stream().map(InventoryItemDto::from).toList();
    }

    @Transactional
    public InventoryItemDto createItem(CreateInventoryItemRequest req) {
        InventoryItem item = InventoryItem.builder()
                .tenantId(TenantContext.get())
                .name(req.name())
                .category(req.category().toUpperCase())
                .unit(req.unit())
                .reorderLevel(req.reorderLevel())
                .build();
        return InventoryItemDto.from(itemRepo.save(item));
    }

    @Transactional
    public InventoryItemDto updateItem(Long id, UpdateInventoryItemRequest req) {
        Long tid = TenantContext.get();
        InventoryItem item = itemRepo.findByIdAndTenantId(id, tid)
                .orElseThrow(() -> ApiException.notFound("Inventory item not found"));
        if (req.name() != null && !req.name().isBlank())
            item.setName(req.name().trim());
        if (req.category() != null && !req.category().isBlank())
            item.setCategory(req.category().toUpperCase());
        if (req.unit() != null && !req.unit().isBlank())
            item.setUnit(req.unit().trim());
        item.setReorderLevel(req.reorderLevel());
        return InventoryItemDto.from(itemRepo.save(item));
    }

    @Transactional
    public InventoryTransactionDto recordTransaction(RecordTransactionRequest req) {
        Long tid = TenantContext.get();
        InventoryItem item = itemRepo.findByIdAndTenantId(req.itemId(), tid)
                .orElseThrow(() -> ApiException.notFound("Inventory item not found"));

        String type = req.transactionType().toUpperCase();
        BigDecimal qty = req.quantity();
        BigDecimal unitCost = req.unitCost();
        BigDecimal totalCost = unitCost != null ? unitCost.multiply(qty) : null;

        switch (type) {
            case "PURCHASE" -> item.setQuantityInStock(item.getQuantityInStock().add(qty));
            case "USAGE" -> {
                if (item.getQuantityInStock().compareTo(qty) < 0) {
                    throw ApiException.badRequest("Insufficient stock: " + item.getQuantityInStock() + " " + item.getUnit() + " available");
                }
                item.setQuantityInStock(item.getQuantityInStock().subtract(qty));
            }
            case "ADJUSTMENT" -> item.setQuantityInStock(qty);
            default -> throw ApiException.badRequest("Invalid transaction type: " + type);
        }
        itemRepo.save(item);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        InventoryTransaction tx = InventoryTransaction.builder()
                .tenantId(tid)
                .itemId(item.getId())
                .cycleId(req.cycleId())
                .transactionType(type)
                .quantity(qty)
                .unitCost(unitCost)
                .totalCost(totalCost)
                .notes(req.notes())
                .transactionDate(req.transactionDate() != null ? req.transactionDate() : LocalDate.now())
                .recordedBy(username)
                .build();

        return InventoryTransactionDto.from(txRepo.save(tx), item.getName(), item.getUnit());
    }

    public PageResponse<InventoryTransactionDto> listTransactions(Long itemId, int page, int size) {
        Long tid = TenantContext.get();
        return PageResponse.from(
                txRepo.findByTenantAndItem(tid, itemId, PageRequest.of(page, size))
                        .map(t -> {
                            InventoryItem item = itemRepo.findByIdAndTenantId(t.getItemId(), tid).orElse(null);
                            String name = item != null ? item.getName() : "Unknown";
                            String unit = item != null ? item.getUnit() : "";
                            return InventoryTransactionDto.from(t, name, unit);
                        })
        );
    }
}
