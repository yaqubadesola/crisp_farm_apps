package com.crispfarm.modules.customer;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.customer.dto.CreateCustomerTypeRequest;
import com.crispfarm.modules.customer.dto.CustomerTypeDto;
import com.crispfarm.modules.pricing.PricingTier;
import com.crispfarm.modules.pricing.PricingTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerTypeService {

    private final CustomerTypeRepository repo;
    private final PricingTierRepository pricingTierRepo;

    @Transactional(readOnly = true)
    public List<CustomerTypeDto> listAll() {
        Long tenantId = TenantContext.get();
        return repo.findByTenantIdOrderByTypeName(tenantId).stream()
                .map(ct -> {
                    BigDecimal price = pricingTierRepo.findByTierNameAndTenantId(ct.getTypeName(), tenantId)
                            .map(PricingTier::getPricePerKg).orElse(BigDecimal.ZERO);
                    String currency = pricingTierRepo.findByTierNameAndTenantId(ct.getTypeName(), tenantId)
                            .map(PricingTier::getCurrency).orElse("NGN");
                    return CustomerTypeDto.from(ct, price, currency);
                }).toList();
    }

    @Transactional
    public CustomerTypeDto create(CreateCustomerTypeRequest req) {
        Long tenantId = TenantContext.get();
        String normalized = req.typeName().toUpperCase().trim();

        if (repo.existsByTypeNameIgnoreCaseAndTenantId(normalized, tenantId)) {
            throw ApiException.badRequest("Customer type already exists: " + normalized);
        }

        CustomerType ct = repo.save(CustomerType.builder()
                .tenantId(tenantId)
                .typeName(normalized)
                .build());

        if (pricingTierRepo.findByTierNameAndTenantId(normalized, tenantId).isEmpty()) {
            pricingTierRepo.save(PricingTier.builder()
                    .tenantId(tenantId)
                    .tierName(normalized)
                    .pricePerKg(req.pricePerKg())
                    .currency("NGN")
                    .updatedBy(SecurityContextHolder.getContext().getAuthentication().getName())
                    .build());
        }

        return CustomerTypeDto.from(ct, req.pricePerKg(), "NGN");
    }
}
