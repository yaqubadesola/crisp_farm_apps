package com.crispfarm.modules.expense;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.expense.dto.CreateExpenseRequest;
import com.crispfarm.modules.expense.dto.ExpenseDto;
import com.crispfarm.modules.expense.dto.ExpenseSummaryDto;
import com.crispfarm.modules.expense.dto.UpdateExpenseRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository repo;

    @Transactional
    public ExpenseDto create(CreateExpenseRequest req) {
        Long tenantId = TenantContext.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        Expense expense = Expense.builder()
                .tenantId(tenantId)
                .category(req.category())
                .amount(req.amount())
                .expenseDate(req.expenseDate())
                .description(req.description())
                .cycleId(req.cycleId())
                .recordedBy(username)
                .build();

        return ExpenseDto.from(repo.save(expense));
    }

    @Transactional(readOnly = true)
    public PageResponse<ExpenseDto> list(LocalDate from, LocalDate to, Long cycleId, int page, int size) {
        LocalDate f = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate t = to != null ? to : LocalDate.now();
        return PageResponse.from(
                repo.findByTenantAndDateRange(TenantContext.get(), f, t, cycleId, PageRequest.of(page, size))
                    .map(ExpenseDto::from)
        );
    }

    @Transactional(readOnly = true)
    public ExpenseDto getById(Long id) {
        return ExpenseDto.from(
                repo.findByIdAndTenantId(id, TenantContext.get())
                    .orElseThrow(() -> ApiException.notFound("Expense not found"))
        );
    }

    @Transactional
    public ExpenseDto update(Long id, UpdateExpenseRequest req) {
        Long tenantId = TenantContext.get();
        Expense expense = repo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Expense not found"));
        if (req.category() != null && !req.category().isBlank()) {
            try {
                expense.setCategory(ExpenseCategory.valueOf(req.category().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Invalid category: " + req.category());
            }
        }
        if (req.amount() != null)
            expense.setAmount(req.amount());
        if (req.expenseDate() != null)
            expense.setExpenseDate(req.expenseDate());
        if (req.description() != null)
            expense.setDescription(req.description().isBlank() ? null : req.description());
        if (req.cycleId() != null)
            expense.setCycleId(req.cycleId() <= 0 ? null : req.cycleId());
        return ExpenseDto.from(repo.save(expense));
    }

    @Transactional
    public void delete(Long id) {
        Long tenantId = TenantContext.get();
        Expense expense = repo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Expense not found"));
        repo.delete(expense);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryDto summary(LocalDate from, LocalDate to) {
        Long tenantId = TenantContext.get();
        BigDecimal total = repo.sumBetween(tenantId, from, to);
        List<Object[]> rows = repo.sumByCategory(tenantId, from, to);
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Object[] row : rows) {
            byCategory.put(row[0].toString(), (BigDecimal) row[1]);
        }
        return new ExpenseSummaryDto(total, byCategory);
    }
}
