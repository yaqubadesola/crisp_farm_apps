package com.crispfarm.modules.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findAllByTenantIdOrderByNameAsc(Long tenantId);
    Optional<InventoryItem> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT i FROM InventoryItem i WHERE i.tenantId = :tid " +
           "AND i.reorderLevel IS NOT NULL AND i.quantityInStock <= i.reorderLevel")
    List<InventoryItem> findLowStock(@Param("tid") Long tenantId);
}
