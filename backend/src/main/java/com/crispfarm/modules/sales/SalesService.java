package com.crispfarm.modules.sales;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.customer.Customer;
import com.crispfarm.modules.customer.CustomerRepository;
import com.crispfarm.modules.cycle.CycleRepository;
import com.crispfarm.modules.payment.PaymentRepository;
import com.crispfarm.modules.pricing.PricingTierService;
import com.crispfarm.modules.sales.dto.CreateSaleRequest;
import com.crispfarm.modules.sales.dto.SaleDto;
import com.crispfarm.modules.sales.dto.UpdateSaleRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesRepository salesRepo;
    private final CustomerRepository customerRepo;
    private final CycleRepository cycleRepo;
    private final PricingTierService pricingTierService;
    private final PaymentRepository paymentRepo;

    @Transactional
    public SaleDto create(CreateSaleRequest req) {
        Long tenantId = TenantContext.get();

        Customer customer = customerRepo.findByIdAndTenantId(req.customerId(), tenantId)
                .orElseThrow(() -> ApiException.notFound("Customer not found"));

        String tierName = (req.pricingTierName() != null && !req.pricingTierName().isBlank())
                ? req.pricingTierName().toUpperCase()
                : customer.getCustomerType();
        BigDecimal pricePerKg = pricingTierService.getPriceForTier(tierName);
        BigDecimal totalPrice = pricePerKg.multiply(req.quantityKg()).setScale(2, RoundingMode.HALF_UP);

        String cashierUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        Sale sale = Sale.builder()
                .tenantId(tenantId)
                .customerId(customer.getId())
                .cycleId(req.cycleId())
                .saleDate(LocalDate.now())
                .totalQuantityKg(req.quantityKg())
                .totalPrice(totalPrice)
                .paymentMethod(req.paymentMethod().toUpperCase())
                .invoiceStatus("CREDIT".equalsIgnoreCase(req.paymentMethod()) ? "UNPAID" : "PAID")
                .notes(req.notes())
                .build();

        Sale saved = salesRepo.save(sale);

        saved.setInvoiceNumber(
                String.format("INV-%d-%06d", Year.now().getValue(), saved.getId())
        );

        SaleItem item = SaleItem.builder()
                .tenantId(tenantId)
                .sale(saved)
                .quantityKg(req.quantityKg())
                .unitPrice(pricePerKg)
                .subtotal(totalPrice)
                .build();
        saved.getItems().add(item);

        saved = salesRepo.save(saved);

        return SaleDto.from(saved, customer.getName(), customer.getCustomerType(), null);
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleDto> list(LocalDate from, LocalDate to, String status, Long cycleId, int page, int size) {
        Long tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        LocalDate f = (from != null) ? from : LocalDate.of(2000, 1, 1);
        LocalDate t = (to != null) ? to : LocalDate.now();
        String s = (status != null && !status.isBlank()) ? status.toUpperCase() : null;
        Page<Sale> result = salesRepo.findByTenantAndDateRange(tenantId, f, t, s, cycleId, pageable);
        return PageResponse.from(result.map(sale -> enrichSale(sale, tenantId)));
    }

    @Transactional(readOnly = true)
    public SaleDto getById(Long id) {
        Long tenantId = TenantContext.get();
        Sale sale = salesRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Sale not found"));
        return enrichSale(sale, tenantId);
    }

    @Transactional
    public SaleDto update(Long id, UpdateSaleRequest req) {
        Long tenantId = TenantContext.get();
        Sale sale = salesRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Sale not found"));

        if (req.saleDate() != null) sale.setSaleDate(req.saleDate());
        if (req.paymentMethod() != null) sale.setPaymentMethod(req.paymentMethod().toUpperCase());
        if (req.invoiceStatus() != null) sale.setInvoiceStatus(req.invoiceStatus().toUpperCase());
        if (req.notes() != null) sale.setNotes(req.notes());
        if (req.cycleId() != null) sale.setCycleId(req.cycleId() <= 0 ? null : req.cycleId());

        if (req.quantityKg() != null || req.pricingTierName() != null) {
            BigDecimal qty = req.quantityKg() != null ? req.quantityKg() : sale.getTotalQuantityKg();
            BigDecimal unitPrice;
            if (req.pricingTierName() != null && !req.pricingTierName().isBlank()) {
                unitPrice = pricingTierService.getPriceForTier(req.pricingTierName().toUpperCase());
            } else {
                unitPrice = sale.getItems().isEmpty() ? BigDecimal.ZERO
                        : sale.getItems().get(0).getUnitPrice();
            }
            BigDecimal newTotal = unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);
            sale.setTotalQuantityKg(qty);
            sale.setTotalPrice(newTotal);
            if (!sale.getItems().isEmpty()) {
                SaleItem item = sale.getItems().get(0);
                item.setQuantityKg(qty);
                item.setUnitPrice(unitPrice);
                item.setSubtotal(newTotal);
            }
        }

        sale = salesRepo.save(sale);
        return enrichSale(sale, tenantId);
    }

    @Transactional
    public void delete(Long id) {
        Long tenantId = TenantContext.get();
        Sale sale = salesRepo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Sale not found"));
        // Delete payments first — payments.sale_id has no CASCADE so it must be cleared manually
        paymentRepo.deleteAll(paymentRepo.findBySaleIdAndTenantIdOrderByPaymentDateDesc(id, tenantId));
        salesRepo.delete(sale);
    }

    private SaleDto enrichSale(Sale sale, Long tenantId) {
        String customerName = customerRepo.findByIdAndTenantId(sale.getCustomerId(), tenantId)
                .map(Customer::getName).orElse("Unknown");
        String customerType = customerRepo.findByIdAndTenantId(sale.getCustomerId(), tenantId)
                .map(Customer::getCustomerType).orElse("");
        String cycleName = sale.getCycleId() != null
                ? cycleRepo.findById(sale.getCycleId()).map(c -> c.getName()).orElse(null)
                : null;
        return SaleDto.from(sale, customerName, customerType, cycleName);
    }
}
