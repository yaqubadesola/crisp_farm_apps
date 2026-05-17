package com.crispfarm.modules.expense;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.modules.expense.dto.CreateExpenseRequest;
import com.crispfarm.modules.expense.dto.ExpenseDto;
import com.crispfarm.modules.expense.dto.ExpenseSummaryDto;
import com.crispfarm.modules.expense.dto.UpdateExpenseRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<ExpenseDto> create(@Valid @RequestBody CreateExpenseRequest req) {
        return ApiResponse.success(expenseService.create(req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<PageResponse<ExpenseDto>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(expenseService.list(from, to, cycleId, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<ExpenseDto> getById(@PathVariable Long id) {
        return ApiResponse.success(expenseService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<ExpenseDto> update(@PathVariable Long id, @RequestBody UpdateExpenseRequest req) {
        return ApiResponse.success(expenseService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        expenseService.delete(id);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<ExpenseSummaryDto> summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success(expenseService.summary(from, to));
    }
}
