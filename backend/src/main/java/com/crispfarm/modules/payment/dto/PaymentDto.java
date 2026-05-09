package com.crispfarm.modules.payment.dto;

import com.crispfarm.modules.payment.Payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentDto(
        Long id,
        Long saleId,
        BigDecimal amount,
        LocalDate paymentDate,
        String paymentMethod,
        String notes,
        String recordedBy,
        LocalDateTime createdAt
) {
    public static PaymentDto from(Payment p) {
        return new PaymentDto(
                p.getId(), p.getSaleId(), p.getAmount(),
                p.getPaymentDate(), p.getPaymentMethod(),
                p.getNotes(), p.getRecordedBy(), p.getCreatedAt()
        );
    }
}
