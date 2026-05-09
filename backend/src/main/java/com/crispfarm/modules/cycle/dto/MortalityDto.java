package com.crispfarm.modules.cycle.dto;

import com.crispfarm.modules.cycle.CycleMortality;

import java.time.LocalDate;

public record MortalityDto(Long id, int count, String cause, LocalDate recordedDate, String recordedBy) {
    public static MortalityDto from(CycleMortality m) {
        return new MortalityDto(m.getId(), m.getCount(), m.getCause(), m.getRecordedDate(), m.getRecordedBy());
    }
}
