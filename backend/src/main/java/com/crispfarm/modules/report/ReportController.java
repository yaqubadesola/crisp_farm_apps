package com.crispfarm.modules.report;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.report.dto.DailySalesReportDto;
import com.crispfarm.modules.report.dto.RangeReportDto;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<DailySalesReportDto> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(reportService.dailyReport(
                date != null ? date : LocalDate.now()));
    }

    @GetMapping("/range")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<RangeReportDto> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long cycleId) {
        return ApiResponse.success(reportService.rangeReport(from, to, cycleId));
    }

    @GetMapping("/breakdown")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<List<DailySalesReportDto>> breakdown(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long cycleId) {
        return ApiResponse.success(reportService.dailyBreakdown(from, to, cycleId));
    }
}
