package com.crispfarm.modules.pond;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PondRepository extends JpaRepository<Pond, Long> {
    List<Pond> findAllByTenantIdOrderByNameAsc(Long tenantId);
    List<Pond> findAllByTenantIdAndActiveOrderByNameAsc(Long tenantId, boolean active);
    Optional<Pond> findByIdAndTenantId(Long id, Long tenantId);
}
