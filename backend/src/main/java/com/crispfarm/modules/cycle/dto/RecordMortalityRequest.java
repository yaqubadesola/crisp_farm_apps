package com.crispfarm.modules.cycle.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RecordMortalityRequest(
        @NotNull @Min(1) Integer count,
        String cause,
        @NotNull LocalDate recordedDate
) {}
