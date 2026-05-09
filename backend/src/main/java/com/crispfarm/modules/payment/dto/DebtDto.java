package com.crispfarm.modules.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DebtDto(
        Long saleId,
        String invoiceNumber,
        Long customerId,
        String customerName,
        LocalDate saleDate,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal balance,
        String invoiceStatus
) {}
