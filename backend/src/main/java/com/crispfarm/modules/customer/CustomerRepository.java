package com.crispfarm.modules.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tid AND " +
           "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))" +
           " ORDER BY c.name ASC")
    Page<Customer> search(@Param("tid") Long tenantId,
                          @Param("search") String search,
                          Pageable pageable);

    Optional<Customer> findByIdAndTenantId(Long id, Long tenantId);
}
