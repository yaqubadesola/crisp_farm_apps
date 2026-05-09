package com.crispfarm.modules.pond;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.pond.dto.PondDto;
import com.crispfarm.modules.pond.dto.SavePondRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ponds")
@RequiredArgsConstructor
public class PondController {

    private final PondService pondService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<List<PondDto>> list(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return ApiResponse.success(pondService.listAll(activeOnly));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<PondDto> create(@Valid @RequestBody SavePondRequest req) {
        return ApiResponse.success(pondService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<PondDto> update(@PathVariable Long id, @Valid @RequestBody SavePondRequest req) {
        return ApiResponse.success(pondService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivate(@PathVariable Long id) {
        pondService.deactivate(id);
    }
}
