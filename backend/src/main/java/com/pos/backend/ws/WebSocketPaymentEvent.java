package com.pos.backend.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class WebSocketPaymentEvent {
    private Long orderId;
    private String paymentStatus;
    private String paymentId;
}
