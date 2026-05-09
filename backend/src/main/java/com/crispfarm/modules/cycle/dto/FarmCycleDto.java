package com.crispfarm.modules.cycle.dto;

import com.crispfarm.modules.cycle.FarmCycle;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FarmCycleDto(
        Long id,
        String name,
        Long pondId,
        String pondName,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        Integer fingerlingCount,
        String fingerlingSource,
        BigDecimal expectedYieldKg,
        BigDecimal actualYieldKg,
        int totalMortalities,
        String notes,
        String createdBy,
        LocalDateTime createdAt
) {
    public static FarmCycleDto from(FarmCycle c, String pondName) {
        return new FarmCycleDto(
                c.getId(), c.getName(), c.getPondId(), pondName,
                c.getStartDate(), c.getEndDate(), c.getStatus(),
                c.getFingerlingCount(), c.getFingerlingSource(),
                c.getExpectedYieldKg(), c.getActualYieldKg(),
                c.getTotalMortalities(), c.getNotes(),
                c.getCreatedBy(), c.getCreatedAt()
        );
    }
}
