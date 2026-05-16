package com.crispfarm.modules.crisis;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.modules.crisis.dto.CrisisEventDto;
import com.crispfarm.modules.crisis.dto.SaveCrisisEventRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/crisis")
@RequiredArgsConstructor
public class CrisisEventController {

    private final CrisisEventService service;

    @GetMapping
    public ApiResponse<PageResponse<CrisisEventDto>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(service.list(from, to, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CrisisEventDto> create(@Valid @RequestBody SaveCrisisEventRequest req) {
        return ApiResponse.success(service.create(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<CrisisEventDto> update(@PathVariable Long id,
                                               @RequestBody SaveCrisisEventRequest req) {
        return ApiResponse.success(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
