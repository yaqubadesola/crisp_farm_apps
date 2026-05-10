package com.crispfarm.modules.auth;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.config.LoginRateLimiterService;
import com.crispfarm.modules.auth.dto.LoginRequest;
import com.crispfarm.modules.auth.dto.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiterService rateLimiter;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ip = resolveClientIp(httpRequest);

        if (!rateLimiter.tryConsume(ip)) {
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Too many login attempts. Please wait 1 minute and try again."));
        }

        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    private String resolveClientIp(HttpServletRequest request) {
        // Handles reverse-proxy headers (Render, Vercel, Cloudflare, etc.)
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
