package com.crispfarm.modules.auth;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.config.JwtService;
import com.crispfarm.modules.auth.dto.LoginRequest;
import com.crispfarm.modules.auth.dto.LoginResponse;
import com.crispfarm.modules.tenant.Tenant;
import com.crispfarm.modules.tenant.TenantRepository;
import com.crispfarm.modules.user.User;
import com.crispfarm.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        // Find user across all tenants by username — then validate password
        // For single-tenant MVP: look up by username across all tenants
        User user = userRepository.findAll().stream()
                .filter(u -> u.getUsername().equals(request.username()) && u.isActive())
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        Tenant tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tenant not found"));

        if (!tenant.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account suspended");
        }

        String token = jwtService.generate(user.getUsername(), user.getRole().name(), tenant.getId());

        return new LoginResponse(
                token,
                user.getUsername(),
                user.getFullName(),
                user.getRole().name(),
                tenant.getId(),
                tenant.getName()
        );
    }
}
