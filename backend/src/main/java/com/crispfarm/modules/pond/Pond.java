package com.crispfarm.modules.pond;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "ponds")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Pond extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "capacity_kg", precision = 10, scale = 2)
    private BigDecimal capacityKg;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
