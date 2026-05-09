package com.crispfarm.modules.inventory;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "inventory_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class InventoryItem extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(name = "quantity_in_stock", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal quantityInStock = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "kg";

    @Column(name = "reorder_level", precision = 10, scale = 2)
    private BigDecimal reorderLevel;
}
