package com.crispfarm.modules.customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerTypeRepository extends JpaRepository<CustomerType, Long> {
    List<CustomerType> findByTenantIdOrderByTypeName(Long tenantId);
    boolean existsByTypeNameIgnoreCaseAndTenantId(String typeName, Long tenantId);
}
