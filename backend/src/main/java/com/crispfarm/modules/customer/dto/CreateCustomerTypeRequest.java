package com.crispfarm.modules.customer.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateCustomerTypeRequest(
        @NotBlank String typeName,
        @NotNull @DecimalMin("0") BigDecimal pricePerKg
) {}
