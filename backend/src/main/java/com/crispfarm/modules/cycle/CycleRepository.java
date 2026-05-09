package com.crispfarm.modules.cycle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CycleRepository extends JpaRepository<FarmCycle, Long> {
    List<FarmCycle> findAllByTenantIdOrderByStartDateDesc(Long tenantId);
    List<FarmCycle> findAllByTenantIdAndStatusOrderByStartDateDesc(Long tenantId, String status);
    Optional<FarmCycle> findByIdAndTenantId(Long id, Long tenantId);

    @Query("SELECT c FROM FarmCycle c WHERE c.tenantId = :tid AND c.status = 'ACTIVE' ORDER BY c.startDate DESC")
    Optional<FarmCycle> findActiveCycle(@Param("tid") Long tenantId);
}
