package com.pos.backend.service.Kitchen;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.EventType;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;
import com.pos.backend.dto.request.Kitchen.StartCookingRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.Order.OrderCommonService;
import com.pos.backend.service.WebSocket.WebSocketService;
import com.pos.backend.ws.WebSocketEvent;

@ExtendWith(MockitoExtension.class)
class KitchenServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private OrderItemAddonRepository orderItemAddonRepository;
    @Mock
    private OrderCommonService orderCommonService;
    @Mock
    private WebSocketService webSocketService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private KitchenService service;

    /* ------------------------------------------------------------ */
    /*  startCooking                                                 */
    /* ------------------------------------------------------------ */

    @Test
    void startCooking_success_setsInKitchenPreparingAndNotifies() {
        Order order = order(1L, OrderStatus.pending, KitchenStatus.new_order);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = service.startCooking(1L, new StartCookingRequest(25));

        assertEquals("in_kitchen", response.getKitchenStatus());
        assertEquals("preparing", response.getStatus());
        assertEquals(Integer.valueOf(25), response.getEstimatedMinutes());
        assertEquals(OrderStatus.preparing, order.getStatus());
        assertNotNull(order.getCookingStartedAt());
        verify(orderRepository).save(order);
        verify(webSocketService).sendTopic(eq("/orders"), any(WebSocketEvent.class));
        verify(notificationService).notifyOrderEvent(eq("Cooking Started"), anyString(), eq(1L));
    }

    @Test
    void startCooking_whenOrderNotFound_throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> service.startCooking(99L, new StartCookingRequest(25)));

        assertEquals(ErrorCode.ORDER_NOT_FOUND, ex.getErrorCode());
        verify(orderRepository, never()).save(any(Order.class));
    }

    /* ------------------------------------------------------------ */
    /*  markComplete                                                 */
    /* ------------------------------------------------------------ */

    @Test
    void markComplete_onPending_promotesToPreparingAndMarksItemsReady() {
        Order order = order(1L, OrderStatus.pending, KitchenStatus.in_kitchen);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = service.markComplete(1L);

        assertEquals("completed", response.getKitchenStatus());
        // The response carries the promoted status for the realtime push.
        assertEquals("preparing", response.getStatus());
        assertEquals(KitchenStatus.completed, order.getKitchenStatus());
        assertEquals(OrderStatus.preparing, order.getStatus());
        verify(orderItemRepository).updateStatusByOrderId(1L, OrderItemStatus.ready);
        // Realtime contract: the push is an ORDER_UPDATED event whose payload
        // carries the promoted status (see buildOrderResponse).
        verify(webSocketService).sendTopic(eq("/orders"), argThat(event ->
                event instanceof WebSocketEvent<?> we
                        && we.getType() == EventType.ORDER_UPDATED
                        && we.getData() instanceof OrderResponse data
                        && "preparing".equals(data.getStatus())));
        verify(notificationService).notifyOrderEvent(eq("Order Ready"), anyString(), eq(1L));
    }

    @Test
    void markComplete_onPreparing_keepsPreparing() {
        Order order = order(1L, OrderStatus.preparing, KitchenStatus.in_kitchen);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = service.markComplete(1L);

        assertEquals("completed", response.getKitchenStatus());
        assertEquals("preparing", response.getStatus());
        assertEquals(OrderStatus.preparing, order.getStatus());
        verify(orderItemRepository).updateStatusByOrderId(1L, OrderItemStatus.ready);
    }

    @Test
    void markComplete_onCancelled_throwsAndMutatesNothing() {
        Order order = order(1L, OrderStatus.cancelled, KitchenStatus.cancelled);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> service.markComplete(1L));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());
        verify(orderRepository, never()).save(any(Order.class));
        verify(orderItemRepository, never()).updateStatusByOrderId(anyLong(), any());
        verify(webSocketService, never()).sendTopic(anyString(), any());
    }

    @Test
    void markComplete_onCompleted_throws() {
        Order order = order(1L, OrderStatus.completed, KitchenStatus.completed);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> service.markComplete(1L));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void markComplete_whenAlreadyCompletedInKitchen_throwsWithoutDuplicatingNotification() {
        // kitchenStatus already completed (e.g. a second click / retried request)
        // while the order status itself is still preparing — must be rejected so
        // the "Order Ready" notification is not sent twice.
        Order order = order(1L, OrderStatus.preparing, KitchenStatus.completed);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> service.markComplete(1L));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());
        verify(orderRepository, never()).save(any(Order.class));
        verify(orderItemRepository, never()).updateStatusByOrderId(anyLong(), any());
        verify(notificationService, never()).notifyOrderEvent(anyString(), anyString(), anyLong());
        verify(webSocketService, never()).sendTopic(anyString(), any());
    }

    @Test
    void markComplete_whenOrderNotFound_throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.markComplete(99L));

        assertEquals(ErrorCode.ORDER_NOT_FOUND, ex.getErrorCode());
    }

    /* ------------------------------------------------------------ */
    /*  cancel                                                       */
    /* ------------------------------------------------------------ */

    @Test
    void cancel_setsCancelledAndMarksItemsCancelled() {
        Order order = order(1L, OrderStatus.preparing, KitchenStatus.in_kitchen);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = service.cancel(1L);

        assertEquals("cancelled", response.getKitchenStatus());
        assertEquals("cancelled", response.getStatus());
        assertEquals(OrderStatus.cancelled, order.getStatus());
        verify(orderItemRepository).updateStatusByOrderId(1L, OrderItemStatus.cancelled);
        verify(webSocketService).sendTopic(eq("/orders"), any(WebSocketEvent.class));
    }

    /* ------------------------------------------------------------ */
    /*  markDelayed                                                  */
    /* ------------------------------------------------------------ */

    @Test
    void markDelayed_setsDelayedAndNotifies() {
        Order order = order(1L, OrderStatus.preparing, KitchenStatus.in_kitchen);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = service.markDelayed(1L);

        assertEquals("delayed", response.getKitchenStatus());
        assertEquals("preparing", response.getStatus(),
                "markDelayed must not change the order status");
        verify(notificationService).notifyOrderEvent(eq("Order Delayed"), anyString(), eq(1L));
        verify(webSocketService).sendTopic(eq("/orders"), any(WebSocketEvent.class));
    }

    /* ------------------------------------------------------------ */
    /*  getKitchenStats                                              */
    /* ------------------------------------------------------------ */

    @Test
    void getKitchenStats_aggregatesCountsAndDefaultsMissingToZero() {
        when(orderRepository.countOrderByKitchenStatus()).thenReturn(List.of(
                statusCount("in_kitchen", 3L),
                statusCount("completed", 7L)));

        Map<String, Long> stats = service.getKitchenStats();

        assertEquals(KitchenStatus.values().length, stats.size());
        assertEquals(3L, stats.get("in_kitchen"));
        assertEquals(7L, stats.get("completed"));
        assertEquals(0L, stats.get("new_order"));
        assertEquals(0L, stats.get("delayed"));
        assertEquals(0L, stats.get("cancelled"));
    }

    /* ------------------------------------------------------------ */
    /*  Helpers                                                      */
    /* ------------------------------------------------------------ */

    private Order order(Long id, OrderStatus status, KitchenStatus kitchenStatus) {
        return Order.builder()
                .id(id)
                .orderNumber("#" + id)
                .tokenNo("T-" + id)
                .orderType(OrderType.take_away)
                .status(status)
                .kitchenStatus(kitchenStatus)
                .orderedAt(LocalDateTime.now())
                .build();
    }

    private KitchenStatusCount statusCount(String status, Long total) {
        return new KitchenStatusCount() {
            @Override
            public String getKitchenStatus() {
                return status;
            }

            @Override
            public Long getTotalOrder() {
                return total;
            }
        };
    }
}
