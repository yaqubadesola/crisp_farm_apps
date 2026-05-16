package com.crispfarm.modules.crisis;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface CrisisEventRepository extends JpaRepository<CrisisEvent, Long> {

    @Query("SELECT c FROM CrisisEvent c WHERE c.tenantId = :tid " +
           "AND c.eventDate BETWEEN :from AND :to " +
           "ORDER BY c.eventDate DESC, c.createdAt DESC")
    Page<CrisisEvent> findByTenantAndDateRange(@Param("tid") Long tenantId,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to,
                                               Pageable pageable);

    Optional<CrisisEvent> findByIdAndTenantId(Long id, Long tenantId);
}
