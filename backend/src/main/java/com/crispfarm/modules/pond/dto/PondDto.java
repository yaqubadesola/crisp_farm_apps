package com.crispfarm.modules.pond.dto;

import com.crispfarm.modules.pond.Pond;

import java.math.BigDecimal;

public record PondDto(Long id, String name, BigDecimal capacityKg, String notes, boolean active) {
    public static PondDto from(Pond p) {
        return new PondDto(p.getId(), p.getName(), p.getCapacityKg(), p.getNotes(), p.isActive());
    }
}
