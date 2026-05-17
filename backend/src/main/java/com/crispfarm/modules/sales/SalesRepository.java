package com.crispfarm.modules.sales;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

public interface SalesRepository extends JpaRepository<Sale, Long> {

    @Query("SELECT s FROM Sale s WHERE s.tenantId = :tid " +
           "AND s.saleDate BETWEEN :from AND :to " +
           "AND (:status IS NULL OR s.invoiceStatus = :status) " +
           "AND (:cycleId IS NULL OR s.cycleId = :cycleId) " +
           "ORDER BY s.saleDate DESC, s.createdAt DESC")
    Page<Sale> findByTenantAndDateRange(@Param("tid") Long tenantId,
                                        @Param("from") LocalDate from,
                                        @Param("to") LocalDate to,
                                        @Param("status") String status,
                                        @Param("cycleId") Long cycleId,
                                        Pageable pageable);

    Optional<Sale> findByIdAndTenantId(Long id, Long tenantId);

    long countByCustomerIdAndTenantId(Long customerId, Long tenantId);

    @Query("SELECT s FROM Sale s WHERE s.tenantId = :tid AND s.invoiceStatus = 'UNPAID' ORDER BY s.saleDate DESC")
    java.util.List<Sale> findUnpaidByTenant(@Param("tid") Long tenantId);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId")
    BigDecimal sumRevenueByCycleId(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId")
    Long countByCycleId(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate = :date")
    BigDecimal sumRevenueByDate(@Param("tid") Long tenantId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(s.totalQuantityKg), 0) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate = :date")
    BigDecimal sumQtyByDate(@Param("tid") Long tenantId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate = :date")
    Long countByDate(@Param("tid") Long tenantId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate BETWEEN :from AND :to")
    BigDecimal sumRevenueBetween(@Param("tid") Long tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.totalQuantityKg), 0) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate BETWEEN :from AND :to")
    BigDecimal sumQtyBetween(@Param("tid") Long tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.tenantId = :tid AND s.saleDate BETWEEN :from AND :to")
    Long countBetween(@Param("tid") Long tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate BETWEEN :from AND :to")
    BigDecimal sumRevenueByCycleAndDateRange(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.totalQuantityKg), 0) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate BETWEEN :from AND :to")
    BigDecimal sumQtyByCycleAndDateRange(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate BETWEEN :from AND :to")
    Long countByCycleAndDateRange(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate = :date")
    BigDecimal sumRevenueByCycleAndDate(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(s.totalQuantityKg), 0) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate = :date")
    BigDecimal sumQtyByCycleAndDate(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.tenantId = :tid AND s.cycleId = :cycleId AND s.saleDate = :date")
    Long countByCycleAndDate(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("date") LocalDate date);

    @Modifying
    @Query("UPDATE Sale s SET s.cycleId = :cycleId WHERE s.tenantId = :tid AND s.cycleId IS NULL")
    int assignCycleToUnlinked(@Param("cycleId") Long cycleId, @Param("tid") Long tenantId);
}
