package com.crispfarm.modules.pricing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PricingTierRepository extends JpaRepository<PricingTier, Long> {
    List<PricingTier> findAllByTenantIdOrderByTierName(Long tenantId);
    Optional<PricingTier> findByTierNameAndTenantId(String tierName, Long tenantId);
}
