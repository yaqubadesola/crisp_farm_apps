package com.crispfarm.modules.pond.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record SavePondRequest(
        @NotBlank String name,
        BigDecimal capacityKg,
        String notes
) {}
