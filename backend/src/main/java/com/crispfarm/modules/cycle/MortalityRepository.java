package com.crispfarm.modules.cycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MortalityRepository extends JpaRepository<CycleMortality, Long> {
    List<CycleMortality> findByCycleIdAndTenantIdOrderByRecordedDateDesc(Long cycleId, Long tenantId);
}
