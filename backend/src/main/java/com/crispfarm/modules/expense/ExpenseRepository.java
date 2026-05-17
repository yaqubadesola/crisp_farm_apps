package com.crispfarm.modules.expense;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e WHERE e.tenantId = :tid " +
           "AND e.expenseDate BETWEEN :from AND :to " +
           "AND (:cycleId IS NULL OR e.cycleId = :cycleId) " +
           "ORDER BY e.expenseDate DESC, e.createdAt DESC")
    Page<Expense> findByTenantAndDateRange(@Param("tid") Long tenantId,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to,
                                           @Param("cycleId") Long cycleId,
                                           Pageable pageable);

    Optional<Expense> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.tenantId = :tid AND e.cycleId = :cycleId")
    BigDecimal sumByCycleId(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.tenantId = :tid AND e.expenseDate BETWEEN :from AND :to")
    BigDecimal sumBetween(@Param("tid") Long tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.tenantId = :tid AND e.cycleId = :cycleId AND e.expenseDate BETWEEN :from AND :to")
    BigDecimal sumByCycleAndDateRange(@Param("tid") Long tenantId, @Param("cycleId") Long cycleId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.tenantId = :tid AND e.expenseDate BETWEEN :from AND :to " +
           "GROUP BY e.category")
    List<Object[]> sumByCategory(@Param("tid") Long tenantId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Modifying
    @Query("UPDATE Expense e SET e.cycleId = :cycleId WHERE e.tenantId = :tid AND e.cycleId IS NULL")
    int assignCycleToUnlinked(@Param("cycleId") Long cycleId, @Param("tid") Long tenantId);
}
