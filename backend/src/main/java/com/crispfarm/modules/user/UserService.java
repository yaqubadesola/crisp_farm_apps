package com.crispfarm.modules.user;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.user.dto.CreateUserRequest;
import com.crispfarm.modules.user.dto.UpdateUserRequest;
import com.crispfarm.modules.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto> listAll() {
        return userRepository.findAllByTenantIdOrderByCreatedAtDesc(TenantContext.get())
                .stream().map(UserDto::from).toList();
    }

    public UserDto create(CreateUserRequest req) {
        Long tenantId = TenantContext.get();
        if (userRepository.existsByUsernameAndTenantId(req.username(), tenantId)) {
            throw ApiException.conflict("Username already exists");
        }
        UserRole role;
        try {
            role = UserRole.valueOf(req.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid role: " + req.role());
        }
        User user = User.builder()
                .tenantId(tenantId)
                .username(req.username())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(role)
                .build();
        return UserDto.from(userRepository.save(user));
    }

    public UserDto update(Long id, UpdateUserRequest req) {
        Long tenantId = TenantContext.get();
        User user = userRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (req.active() != null) user.setActive(req.active());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        return UserDto.from(userRepository.save(user));
    }
}
