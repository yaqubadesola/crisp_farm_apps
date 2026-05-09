package com.crispfarm.modules.cycle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateCycleRequest(
        @NotBlank String name,
        @NotNull LocalDate startDate,
        Long pondId,
        Integer fingerlingCount,
        String fingerlingSource,
        BigDecimal expectedYieldKg,
        String notes
) {}
