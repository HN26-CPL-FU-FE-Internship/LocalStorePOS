package com.pos.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseEntity {

    /** vd #57005 */
    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    /** So thu tu hien thi bep/khach */
    @Column(name = "token_no", length = 20)
    private String tokenNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;

    /** NULL/walk-in */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    /** Chi co khi dine_in */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    /** Nhan vien phuc vu / thu ngan tao don */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waiter_id")
    private User waiter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.pending;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "kitchen_status", nullable = false)
    private KitchenStatus kitchenStatus = KitchenStatus.new_order;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "service_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "delivery_charge", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryCharge = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tip_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal tipAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    /** Given Amount */
    @Builder.Default
    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    /** Tien thoi lai */
    @Builder.Default
    @Column(name = "balance_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private OrderPaymentStatus paymentStatus = OrderPaymentStatus.unpaid;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "ordered_at", nullable = false)
    private LocalDateTime orderedAt;
}
