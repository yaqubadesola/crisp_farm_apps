package com.crispfarm.modules.cycle;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "cycle_mortalities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class CycleMortality extends BaseEntity {

    @Column(name = "cycle_id", nullable = false)
    private Long cycleId;

    @Column(nullable = false)
    private int count;

    @Column(length = 200)
    private String cause;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    @Column(name = "recorded_by", length = 50)
    private String recordedBy;
}
