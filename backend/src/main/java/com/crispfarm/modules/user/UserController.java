package com.crispfarm.modules.user;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.user.dto.CreateUserRequest;
import com.crispfarm.modules.user.dto.UpdateUserRequest;
import com.crispfarm.modules.user.dto.UserDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(userService.listAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userService.create(req)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> update(@PathVariable Long id,
                                                        @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userService.update(id, req)));
    }
}
