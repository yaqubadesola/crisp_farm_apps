package com.crispfarm.modules.pricing;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pricing_tiers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "tier_name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PricingTier extends BaseEntity {

    @Column(name = "tier_name", nullable = false, length = 20)
    private String tierName;

    @Column(name = "price_per_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerKg;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "NGN";

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;
}
