package com.crispfarm.modules.cycle;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "cycles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class FarmCycle extends BaseEntity {

    @Column(name = "pond_id")
    private Long pondId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "fingerling_count")
    private Integer fingerlingCount;

    @Column(name = "fingerling_source", length = 100)
    private String fingerlingSource;

    @Column(name = "expected_yield_kg", precision = 10, scale = 2)
    private BigDecimal expectedYieldKg;

    @Column(name = "actual_yield_kg", precision = 10, scale = 2)
    private BigDecimal actualYieldKg;

    @Column(name = "total_mortalities", nullable = false)
    @Builder.Default
    private int totalMortalities = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by", length = 50)
    private String createdBy;
}
