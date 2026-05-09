package com.crispfarm.seed;

import com.crispfarm.modules.customer.CustomerType;
import com.crispfarm.modules.customer.CustomerTypeRepository;
import com.crispfarm.modules.pricing.PricingTier;
import com.crispfarm.modules.pricing.PricingTierRepository;
import com.crispfarm.modules.tenant.Tenant;
import com.crispfarm.modules.tenant.TenantRepository;
import com.crispfarm.modules.user.User;
import com.crispfarm.modules.user.UserRepository;
import com.crispfarm.modules.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PricingTierRepository pricingTierRepository;
    private final CustomerTypeRepository customerTypeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedTenantAndAdmin();
        seedDefaultCustomerTypes();
    }

    private void seedTenantAndAdmin() {
        if (tenantRepository.existsBySlug("crispfarm")) {
            log.info("Seed already applied — skipping tenant/admin");
            return;
        }

        Tenant tenant = tenantRepository.save(Tenant.builder()
                .name("CrispFarm")
                .slug("crispfarm")
                .subscriptionPlan("STARTER")
                .build());
        log.info("Seeded tenant: {} (id={})", tenant.getName(), tenant.getId());

        User admin = userRepository.save(User.builder()
                .tenantId(tenant.getId())
                .username("crispfarm")
                .passwordHash(passwordEncoder.encode("crispAdmin@@2026.."))
                .fullName("CrispFarm Admin")
                .role(UserRole.ADMIN)
                .build());
        log.info("Seeded admin user: {}", admin.getUsername());

        String[][] tiers = {
                {"RETAIL",      "2000.00"},
                {"WHOLESALE",   "1800.00"},
                {"HOTEL",       "2200.00"},
                {"DISTRIBUTOR", "1600.00"},
        };
        for (String[] tier : tiers) {
            pricingTierRepository.save(PricingTier.builder()
                    .tenantId(tenant.getId())
                    .tierName(tier[0])
                    .pricePerKg(new BigDecimal(tier[1]))
                    .currency("NGN")
                    .updatedBy("system")
                    .build());
        }
        log.info("Seeded 4 pricing tiers for tenant {}", tenant.getName());
    }

    private void seedDefaultCustomerTypes() {
        String[] defaults = {"RETAIL", "WHOLESALE", "HOTEL", "DISTRIBUTOR"};
        tenantRepository.findAll().forEach(tenant -> {
            for (String typeName : defaults) {
                if (!customerTypeRepository.existsByTypeNameIgnoreCaseAndTenantId(typeName, tenant.getId())) {
                    customerTypeRepository.save(CustomerType.builder()
                            .tenantId(tenant.getId())
                            .typeName(typeName)
                            .build());
                    log.info("Seeded customer type '{}' for tenant {}", typeName, tenant.getName());
                }
            }
        });
    }
}
