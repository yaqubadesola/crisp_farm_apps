package com.crispfarm.modules.customer.dto;

import com.crispfarm.modules.customer.Customer;

import java.time.LocalDateTime;

public record CustomerDto(
        Long id,
        String name,
        String phone,
        String email,
        String address,
        String customerType,
        LocalDateTime createdAt
) {
    public static CustomerDto from(Customer c) {
        return new CustomerDto(c.getId(), c.getName(), c.getPhone(), c.getEmail(),
                c.getAddress(), c.getCustomerType(), c.getCreatedAt());
    }
}
