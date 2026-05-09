package com.crispfarm.modules.pricing;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.pricing.dto.PricingTierDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingTierService {

    private final PricingTierRepository repo;

    public List<PricingTierDto> listAll() {
        return repo.findAllByTenantIdOrderByTierName(TenantContext.get())
                .stream().map(PricingTierDto::from).toList();
    }

    public PricingTierDto update(String tierName, BigDecimal pricePerKg) {
        Long tenantId = TenantContext.get();
        PricingTier tier = repo.findByTierNameAndTenantId(tierName.toUpperCase(), tenantId)
                .orElseThrow(() -> ApiException.notFound("Pricing tier not found: " + tierName));
        tier.setPricePerKg(pricePerKg);
        tier.setUpdatedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        return PricingTierDto.from(repo.save(tier));
    }

    public BigDecimal getPriceForTier(String tierName) {
        return repo.findByTierNameAndTenantId(tierName.toUpperCase(), TenantContext.get())
                .map(PricingTier::getPricePerKg)
                .orElseThrow(() -> ApiException.notFound("No pricing for tier: " + tierName));
    }
}
