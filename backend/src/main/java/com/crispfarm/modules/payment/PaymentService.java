package com.crispfarm.modules.payment;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.customer.Customer;
import com.crispfarm.modules.customer.CustomerRepository;
import com.crispfarm.modules.payment.dto.DebtDto;
import com.crispfarm.modules.payment.dto.DebtSummaryDto;
import com.crispfarm.modules.payment.dto.PaymentDto;
import com.crispfarm.modules.payment.dto.RecordPaymentRequest;
import com.crispfarm.modules.sales.Sale;
import com.crispfarm.modules.sales.SalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final SalesRepository salesRepo;
    private final CustomerRepository customerRepo;

    @Transactional
    public PaymentDto record(RecordPaymentRequest req) {
        Long tenantId = TenantContext.get();

        Sale sale = salesRepo.findByIdAndTenantId(req.saleId(), tenantId)
                .orElseThrow(() -> ApiException.notFound("Sale not found"));

        BigDecimal alreadyPaid = paymentRepo.sumBySaleId(sale.getId(), tenantId);
        BigDecimal remaining = sale.getTotalPrice().subtract(alreadyPaid);

        if (req.amount().compareTo(remaining) > 0) {
            throw ApiException.badRequest(
                    "Payment amount exceeds outstanding balance of " + remaining);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        Payment payment = Payment.builder()
                .tenantId(tenantId)
                .saleId(sale.getId())
                .customerId(sale.getCustomerId())
                .amount(req.amount())
                .paymentDate(req.paymentDate())
                .paymentMethod(req.paymentMethod().toUpperCase())
                .notes(req.notes())
                .recordedBy(username)
                .build();

        Payment saved = paymentRepo.save(payment);

        BigDecimal newPaid = alreadyPaid.add(req.amount());
        if (newPaid.compareTo(sale.getTotalPrice()) >= 0) {
            sale.setInvoiceStatus("PAID");
            salesRepo.save(sale);
        }

        return PaymentDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPaymentsForSale(Long saleId) {
        Long tenantId = TenantContext.get();
        salesRepo.findByIdAndTenantId(saleId, tenantId)
                .orElseThrow(() -> ApiException.notFound("Sale not found"));
        return paymentRepo.findBySaleIdAndTenantIdOrderByPaymentDateDesc(saleId, tenantId)
                .stream().map(PaymentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public DebtSummaryDto listDebts() {
        Long tenantId = TenantContext.get();

        List<Sale> unpaidSales = salesRepo.findUnpaidByTenant(tenantId);

        List<DebtDto> debts = unpaidSales.stream().map(sale -> {
            BigDecimal paid = paymentRepo.sumBySaleId(sale.getId(), tenantId);
            BigDecimal balance = sale.getTotalPrice().subtract(paid);
            String customerName = customerRepo.findByIdAndTenantId(sale.getCustomerId(), tenantId)
                    .map(Customer::getName).orElse("Unknown");
            return new DebtDto(
                    sale.getId(), sale.getInvoiceNumber(),
                    sale.getCustomerId(), customerName,
                    sale.getSaleDate(), sale.getTotalPrice(),
                    paid, balance, sale.getInvoiceStatus()
            );
        }).filter(d -> d.balance().compareTo(BigDecimal.ZERO) > 0).toList();

        BigDecimal totalOutstanding = debts.stream()
                .map(DebtDto::balance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DebtSummaryDto(debts.size(), totalOutstanding, debts);
    }
}
