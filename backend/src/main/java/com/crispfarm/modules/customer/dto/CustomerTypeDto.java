package com.crispfarm.modules.customer.dto;

import com.crispfarm.modules.customer.CustomerType;

import java.math.BigDecimal;

public record CustomerTypeDto(Long id, String typeName, BigDecimal pricePerKg, String currency) {
    public static CustomerTypeDto from(CustomerType ct, BigDecimal pricePerKg, String currency) {
        return new CustomerTypeDto(ct.getId(), ct.getTypeName(), pricePerKg, currency);
    }
}
