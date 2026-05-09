package com.crispfarm.modules.payment;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.payment.dto.DebtSummaryDto;
import com.crispfarm.modules.payment.dto.PaymentDto;
import com.crispfarm.modules.payment.dto.RecordPaymentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<PaymentDto> record(@Valid @RequestBody RecordPaymentRequest req) {
        return ApiResponse.success(paymentService.record(req));
    }

    @GetMapping("/sales/{saleId}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<List<PaymentDto>> getPaymentsForSale(@PathVariable Long saleId) {
        return ApiResponse.success(paymentService.getPaymentsForSale(saleId));
    }

    @GetMapping("/debts")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER','ACCOUNTANT')")
    public ApiResponse<DebtSummaryDto> listDebts() {
        return ApiResponse.success(paymentService.listDebts());
    }
}
