package com.crispfarm.modules.crisis;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "crisis_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class CrisisEvent extends BaseEntity {

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "MEDIUM";

    @Column(name = "affected_count")
    private Integer affectedCount;

    @Column(columnDefinition = "TEXT")
    private String solution;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resolved = false;

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;
}
