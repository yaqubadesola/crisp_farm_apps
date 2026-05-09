package com.crispfarm.modules.cycle.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HarvestRequest(
        @NotNull @DecimalMin("0.001") BigDecimal actualYieldKg,
        @NotNull LocalDate endDate
) {}
