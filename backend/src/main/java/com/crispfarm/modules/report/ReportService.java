package com.crispfarm.modules.report;

import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.expense.ExpenseRepository;
import com.crispfarm.modules.report.dto.DailySalesReportDto;
import com.crispfarm.modules.report.dto.RangeReportDto;
import com.crispfarm.modules.sales.SalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SalesRepository salesRepo;
    private final ExpenseRepository expenseRepo;

    @Transactional(readOnly = true)
    public DailySalesReportDto dailyReport(LocalDate date) {
        Long tid = TenantContext.get();
        BigDecimal revenue = salesRepo.sumRevenueByDate(tid, date);
        BigDecimal qty = salesRepo.sumQtyByDate(tid, date);
        Long count = salesRepo.countByDate(tid, date);
        return new DailySalesReportDto(date, count, qty, revenue);
    }

    @Transactional(readOnly = true)
    public RangeReportDto rangeReport(LocalDate from, LocalDate to) {
        Long tid = TenantContext.get();
        BigDecimal revenue = salesRepo.sumRevenueBetween(tid, from, to);
        BigDecimal qty = salesRepo.sumQtyBetween(tid, from, to);
        Long count = salesRepo.countBetween(tid, from, to);
        BigDecimal expenses = expenseRepo.sumBetween(tid, from, to);
        BigDecimal netProfit = revenue.subtract(expenses);
        return new RangeReportDto(from, to, count, qty, revenue, expenses, netProfit);
    }

    @Transactional(readOnly = true)
    public List<DailySalesReportDto> dailyBreakdown(LocalDate from, LocalDate to) {
        Long tid = TenantContext.get();
        List<DailySalesReportDto> result = new ArrayList<>();
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            BigDecimal revenue = salesRepo.sumRevenueByDate(tid, cursor);
            BigDecimal qty = salesRepo.sumQtyByDate(tid, cursor);
            Long count = salesRepo.countByDate(tid, cursor);
            if (count > 0) {
                result.add(new DailySalesReportDto(cursor, count, qty, revenue));
            }
            cursor = cursor.plusDays(1);
        }
        return result;
    }
}
