package com.crispfarm.modules.expense;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.expense.dto.CreateExpenseRequest;
import com.crispfarm.modules.expense.dto.ExpenseDto;
import com.crispfarm.modules.expense.dto.ExpenseSummaryDto;
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
    public PageResponse<ExpenseDto> list(LocalDate from, LocalDate to, int page, int size) {
        return PageResponse.from(
                repo.findByTenantAndDateRange(TenantContext.get(), from, to, PageRequest.of(page, size))
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
