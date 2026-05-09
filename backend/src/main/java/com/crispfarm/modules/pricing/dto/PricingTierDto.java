package com.crispfarm.modules.pricing.dto;

import com.crispfarm.modules.pricing.PricingTier;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PricingTierDto(
        Long id,
        String tierName,
        BigDecimal pricePerKg,
        String currency,
        LocalDateTime updatedAt,
        String updatedBy
) {
    public static PricingTierDto from(PricingTier t) {
        return new PricingTierDto(t.getId(), t.getTierName(), t.getPricePerKg(),
                t.getCurrency(), t.getUpdatedAt(), t.getUpdatedBy());
    }
}
