package com.crispfarm.modules.inventory;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.modules.inventory.dto.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<List<InventoryItemDto>> listItems() {
        return ApiResponse.success(inventoryService.listItems());
    }

    @GetMapping("/items/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<List<InventoryItemDto>> lowStock() {
        return ApiResponse.success(inventoryService.listLowStock());
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<InventoryItemDto> createItem(@Valid @RequestBody CreateInventoryItemRequest req) {
        return ApiResponse.success(inventoryService.createItem(req));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<InventoryItemDto> updateItem(@PathVariable Long id,
                                                     @RequestBody UpdateInventoryItemRequest req) {
        return ApiResponse.success(inventoryService.updateItem(id, req));
    }

    @PostMapping("/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<InventoryTransactionDto> recordTransaction(
            @Valid @RequestBody RecordTransactionRequest req) {
        return ApiResponse.success(inventoryService.recordTransaction(req));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<PageResponse<InventoryTransactionDto>> listTransactions(
            @RequestParam(required = false) Long itemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(inventoryService.listTransactions(itemId, page, size));
    }
}
