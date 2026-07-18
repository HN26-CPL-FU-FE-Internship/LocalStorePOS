package com.pos.backend.dto.response.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
    BigDecimal subtotal;
    BigDecimal discountAmount;
    BigDecimal taxAmount;
    BigDecimal serviceCharge;
    BigDecimal deliveryCharge;
    BigDecimal tipAmount;
    BigDecimal grandTotal;
    BigDecimal paidAmount;
    BigDecimal balanceAmount;
    String paymentStatus;
    String note;
    LocalDateTime orderedAt;
    List<OrderItemResponse> items;
}
