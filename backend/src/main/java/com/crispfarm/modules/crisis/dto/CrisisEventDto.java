package com.crispfarm.modules.crisis.dto;

import com.crispfarm.modules.crisis.CrisisEvent;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CrisisEventDto(
        Long id,
        LocalDate eventDate,
        String title,
        String severity,
        Integer affectedCount,
        String solution,
        String description,
        Boolean resolved,
        String recordedBy,
        LocalDateTime createdAt
) {
    public static CrisisEventDto from(CrisisEvent e) {
        return new CrisisEventDto(
                e.getId(), e.getEventDate(), e.getTitle(), e.getSeverity(),
                e.getAffectedCount(), e.getSolution(), e.getDescription(),
                e.getResolved(), e.getRecordedBy(), e.getCreatedAt()
        );
    }
}
