package com.crispfarm.modules.sales.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateSaleRequest(
        BigDecimal quantityKg,
        String paymentMethod,
        String invoiceStatus,
        String notes,
        Long cycleId,
        LocalDate saleDate,
        String pricingTierName
) {}
