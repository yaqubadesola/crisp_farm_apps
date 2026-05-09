package com.crispfarm.modules.user.dto;

import com.crispfarm.modules.user.User;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String username,
        String fullName,
        String role,
        boolean active,
        LocalDateTime createdAt
) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getFullName(),
                u.getRole().name(), u.isActive(), u.getCreatedAt());
    }
}
