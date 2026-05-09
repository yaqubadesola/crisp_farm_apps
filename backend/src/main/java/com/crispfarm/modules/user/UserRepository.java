package com.crispfarm.modules.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    List<User> findAllByTenantIdOrderByCreatedAtDesc(Long tenantId);
    boolean existsByUsernameAndTenantId(String username, Long tenantId);
    Optional<User> findByIdAndTenantId(Long id, Long tenantId);
}
