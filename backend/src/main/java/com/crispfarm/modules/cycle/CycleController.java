package com.crispfarm.modules.cycle;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.cycle.dto.*;
import com.crispfarm.modules.cycle.dto.BackfillResultDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleService cycleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','SALES_OFFICER','ACCOUNTANT')")
    public ApiResponse<List<FarmCycleDto>> list(@RequestParam(required = false) String status) {
        return ApiResponse.success(cycleService.listAll(status));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','SALES_OFFICER','ACCOUNTANT')")
    public ApiResponse<FarmCycleDto> getActive() {
        return ApiResponse.success(cycleService.getActiveCycle());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<FarmCycleDto> create(@Valid @RequestBody CreateCycleRequest req) {
        return ApiResponse.success(cycleService.create(req));
    }

    @PostMapping("/{id}/harvest")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<FarmCycleDto> harvest(@PathVariable Long id,
                                              @Valid @RequestBody HarvestRequest req) {
        return ApiResponse.success(cycleService.harvest(id, req));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FarmCycleDto> close(@PathVariable Long id) {
        return ApiResponse.success(cycleService.close(id));
    }

    @PostMapping("/{id}/mortalities")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<MortalityDto> recordMortality(@PathVariable Long id,
                                                      @Valid @RequestBody RecordMortalityRequest req) {
        return ApiResponse.success(cycleService.recordMortality(id, req));
    }

    @GetMapping("/{id}/mortalities")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER')")
    public ApiResponse<List<MortalityDto>> getMortalities(@PathVariable Long id) {
        return ApiResponse.success(cycleService.getMortalities(id));
    }

    @GetMapping("/{id}/profit")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<CycleProfitDto> getProfit(@PathVariable Long id) {
        return ApiResponse.success(cycleService.getProfit(id));
    }

    /**
     * Bulk-assigns all records (expenses, sales, inventory transactions) that have no
     * cycle linked yet to the specified cycle. Admin only — one-time correction action.
     */
    @PostMapping("/{id}/backfill")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BackfillResultDto> backfill(@PathVariable Long id) {
        return ApiResponse.success(cycleService.backfillCycle(id));
    }
}
