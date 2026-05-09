package com.crispfarm.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveCustomerRequest(
        @NotBlank String name,
        String phone,
        String email,
        String address,
        String customerType
) {}
