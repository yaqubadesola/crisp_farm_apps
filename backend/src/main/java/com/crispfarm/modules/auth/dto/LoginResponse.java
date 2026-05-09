package com.crispfarm.modules.auth.dto;

public record LoginResponse(
        String token,
        String username,
        String fullName,
        String role,
        Long tenantId,
        String tenantName
) {}
