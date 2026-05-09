package com.crispfarm.modules.sales;

import com.crispfarm.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Sale extends BaseEntity {

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "cycle_id")
    private Long cycleId;

    @Column(name = "cashier_id")
    private Long cashierId;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "total_quantity_kg", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalQuantityKg;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "invoice_number", unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_status", nullable = false, length = 20)
    @Builder.Default
    private String invoiceStatus = "PAID";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();
}
