package com.crispfarm.modules.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySaleIdAndTenantIdOrderByPaymentDateDesc(Long saleId, Long tenantId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.saleId = :saleId AND p.tenantId = :tid")
    BigDecimal sumBySaleId(@Param("saleId") Long saleId, @Param("tid") Long tenantId);
}
