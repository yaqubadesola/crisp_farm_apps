package com.crispfarm.modules.crisis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SaveCrisisEventRequest(
        @NotNull LocalDate eventDate,
        @NotBlank String title,
        String severity,
        Integer affectedCount,
        String solution,
        String description,
        Boolean resolved
) {}
