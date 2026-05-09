package com.crispfarm.modules.sales.dto;

import com.crispfarm.modules.sales.Sale;
import com.crispfarm.modules.sales.SaleItem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SaleDto(
        Long id,
        Long customerId,
        String customerName,
        String customerType,
        Long cycleId,
        String cycleName,
        LocalDate saleDate,
        BigDecimal totalQuantityKg,
        BigDecimal totalPrice,
        String paymentMethod,
        String invoiceNumber,
        String invoiceStatus,
        String notes,
        LocalDateTime createdAt,
        List<ItemDto> items
) {
    public record ItemDto(BigDecimal quantityKg, BigDecimal unitPrice, BigDecimal subtotal) {
        public static ItemDto from(SaleItem i) {
            return new ItemDto(i.getQuantityKg(), i.getUnitPrice(), i.getSubtotal());
        }
    }

    public static SaleDto from(Sale s, String customerName, String customerType,
                                String cycleName) {
        return new SaleDto(
                s.getId(), s.getCustomerId(), customerName, customerType,
                s.getCycleId(), cycleName,
                s.getSaleDate(), s.getTotalQuantityKg(), s.getTotalPrice(),
                s.getPaymentMethod(), s.getInvoiceNumber(), s.getInvoiceStatus(),
                s.getNotes(), s.getCreatedAt(),
                s.getItems().stream().map(ItemDto::from).toList()
        );
    }
}
