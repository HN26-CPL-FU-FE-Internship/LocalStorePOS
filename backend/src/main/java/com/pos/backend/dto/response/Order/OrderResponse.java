package com.pos.backend.dto.response.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.pos.backend.dto.response.Coupon.CouponResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    Long id;
    String orderNumber;
    String tokenNo;
    String orderType;
    String tableNumber;
    String status;
    String kitchenStatus;
    String customerName;
    Long customerId;
    String waiter;
    Long waiterId;
    Long tableId;
    CouponResponse coupon;
    BigDecimal subtotal;
    BigDecimal discountAmount;
    String discountType;
    BigDecimal taxAmount;
    BigDecimal serviceCharge;
    BigDecimal deliveryCharge;
    BigDecimal tipAmount;
    BigDecimal grandTotal;
    BigDecimal paidAmount;
    BigDecimal balanceAmount;
    String paymentStatus;
    String paymentType;
    String note;
    Integer estimatedMinutes;
    LocalDateTime cookingStartedAt;
    LocalDateTime orderedAt;
    List<OrderItemResponse> items;
}
