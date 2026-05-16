package com.crispfarm.modules.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    @Query("SELECT t FROM InventoryTransaction t WHERE t.tenantId = :tid " +
           "AND (:itemId IS NULL OR t.itemId = :itemId) " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    Page<InventoryTransaction> findByTenantAndItem(@Param("tid") Long tenantId,
                                                    @Param("itemId") Long itemId,
                                                    Pageable pageable);

    long countByItemIdAndTenantId(Long itemId, Long tenantId);
}
