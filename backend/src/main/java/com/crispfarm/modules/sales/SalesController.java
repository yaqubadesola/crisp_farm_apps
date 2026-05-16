package com.crispfarm.modules.sales;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.modules.sales.dto.CreateSaleRequest;
import com.crispfarm.modules.sales.dto.SaleDto;
import com.crispfarm.modules.sales.dto.UpdateSaleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','SALES_OFFICER')")
    public ApiResponse<SaleDto> create(@Valid @RequestBody CreateSaleRequest req) {
        return ApiResponse.success(salesService.create(req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','SALES_OFFICER','ACCOUNTANT')")
    public ApiResponse<PageResponse<SaleDto>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(salesService.list(from, to, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','SALES_OFFICER','ACCOUNTANT')")
    public ApiResponse<SaleDto> getById(@PathVariable Long id) {
        return ApiResponse.success(salesService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SaleDto> update(@PathVariable Long id, @RequestBody UpdateSaleRequest req) {
        return ApiResponse.success(salesService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        salesService.delete(id);
    }
}
