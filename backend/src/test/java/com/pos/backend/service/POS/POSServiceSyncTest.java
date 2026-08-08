package com.pos.backend.service.POS;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.dto.request.POS.CreateOrderItemRequest;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.ItemVariationRepository;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.OrderSequenceRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.NotificationService;
import com.pos.backend.service.WebSocket.WebSocketService;

/**
 * Unit tests for {@link POSService#syncOrderItems} — the smart-sync that
 * decides whether a re-ordered line merges into an existing order item or is
 * split off into a brand-new {@code pending} line when the existing line is
 * already started ({@code preparing}) or finished ({@code ready}/{@code served}).
 */
@ExtendWith(MockitoExtension.class)
class POSServiceSyncTest {

    @Mock
    OrderRepository orderRepository;
    @Mock
    ItemRepository itemRepository;
    @Mock
    ItemVariationRepository itemVariationRepository;
    @Mock
    AddonRepository addonRepository;
    @Mock
    OrderItemRepository orderItemRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    CustomerRepository customerRepository;
    @Mock
    OrderItemAddonRepository orderItemAddonRepository;
    @Mock
    RestaurantTableRepository restaurantTableRepository;
    @Mock
    OrderSequenceRepository orderSequenceRepository;
    @Mock
    WebSocketService webSocketService;
    @Mock
    NotificationService notificationService;

    @InjectMocks
    POSService posService;

    private static final long ITEM_ID = 101L;
    private static final BigDecimal PRICE = new BigDecimal("10.00");

    private Order order;
    private Item item;
    private POSService.OrderReferenceMaps maps;

    @BeforeEach
    void setUp() {
        order = Order.builder().id(1L).build();
        item = Item.builder().id(ITEM_ID).name("Burger").price(PRICE).build();
        // HashMap (not Map.of) so .get(null) for absent variation/addon ids returns null
        maps = new POSService.OrderReferenceMaps(Map.of(ITEM_ID, item), new HashMap<>(), new HashMap<>());
    }

    private OrderItem orderItem(long id, int qty, OrderItemStatus status) {
        return OrderItem.builder()
                .id(id)
                .order(order)
                .item(item)
                .itemName("Burger")
                .unitPrice(PRICE)
                .quantity(qty)
                .lineTotal(PRICE.multiply(BigDecimal.valueOf(qty)))
                .status(status)
                .build();
    }

    private CreateOrderItemRequest request(int qty) {
        return CreateOrderItemRequest.builder()
                .itemId(ITEM_ID)
                .itemName("Burger")
                .unitPrice(PRICE)
                .quantity(qty)
                .lineTotal(PRICE.multiply(BigDecimal.valueOf(qty)))
                .addons(List.of())
                .build();
    }

    private void sync(List<CreateOrderItemRequest> requests, OrderItem... existing) {
        posService.syncOrderItems(order, requests, maps, List.of(existing), Map.of());
    }

    private List<OrderItem> savedItems() {
        ArgumentCaptor<OrderItem> captor = ArgumentCaptor.forClass(OrderItem.class);
        verify(orderItemRepository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues();
    }

    private OrderItem onlyCreatedLine(List<OrderItem> saved) {
        return saved.stream().filter(item -> item.getId() == null).findFirst().orElseThrow();
    }

    /* ── Started lines (preparing/ready/served) are split, never merged ─ */

    @Test
    void addsMoreOfPreparingItem_splitsIntoNewPendingLine() {
        OrderItem preparing = orderItem(100L, 2, OrderItemStatus.preparing);
        sync(List.of(request(3)), preparing);

        // Old line untouched: still 2 x preparing
        assertEquals(2, preparing.getQuantity());
        assertEquals(OrderItemStatus.preparing, preparing.getStatus());

        // Brand-new pending line carrying only the extra amount
        OrderItem created = onlyCreatedLine(savedItems());
        assertEquals(1, created.getQuantity());
        assertEquals(OrderItemStatus.pending, created.getStatus());
    }

    @Test
    void addsMoreOfReadyItem_splitsIntoNewPendingLine() {
        OrderItem ready = orderItem(100L, 2, OrderItemStatus.ready);
        sync(List.of(request(3)), ready);

        // Old line untouched: still 2 x ready
        assertEquals(2, ready.getQuantity());
        assertEquals(OrderItemStatus.ready, ready.getStatus());

        // Brand-new pending line carrying only the extra amount
        OrderItem created = onlyCreatedLine(savedItems());
        assertEquals(1, created.getQuantity());
        assertEquals(OrderItemStatus.pending, created.getStatus());
    }

    @Test
    void addsMoreOfServedItem_splitsIntoNewPendingLine() {
        OrderItem served = orderItem(100L, 2, OrderItemStatus.served);
        sync(List.of(request(3)), served);

        assertEquals(2, served.getQuantity());
        assertEquals(OrderItemStatus.served, served.getStatus());
        OrderItem created = onlyCreatedLine(savedItems());
        assertEquals(1, created.getQuantity());
        assertEquals(OrderItemStatus.pending, created.getStatus());
    }

    /* ── Fresh (pending) lines still merge in place ──────────────────── */

    @Test
    void addsMoreOfPendingItem_mergesQuantityInPlace() {
        OrderItem pending = orderItem(100L, 2, OrderItemStatus.pending);
        sync(List.of(request(3)), pending);

        assertEquals(3, pending.getQuantity());
        assertEquals(OrderItemStatus.pending, pending.getStatus());
        // only the existing line was saved — no brand-new line was created
        assertTrue(savedItems().stream().noneMatch(item -> item.getId() == null));
    }

    /* ── Reductions & removals ──────────────────────────────────────── */

    @Test
    void reducesQuantityBelowCooked_shrinksReadyLineInPlace() {
        OrderItem ready = orderItem(100L, 2, OrderItemStatus.ready);
        sync(List.of(request(1)), ready);

        assertEquals(1, ready.getQuantity());
        assertEquals(OrderItemStatus.ready, ready.getStatus());
    }

    @Test
    void reducesBeyondFirstCookedLine_cancelsExcessCookedLines() {
        OrderItem first = orderItem(100L, 2, OrderItemStatus.ready);
        OrderItem second = orderItem(101L, 1, OrderItemStatus.ready);
        // Only 2 of the 3 cooked units are still wanted → the ×1 line is cancelled
        sync(List.of(request(2)), first, second);

        assertEquals(2, first.getQuantity());
        assertEquals(OrderItemStatus.ready, first.getStatus());
        assertEquals(OrderItemStatus.cancelled, second.getStatus());
    }

    @Test
    void removesItemKey_cancelsExistingLine() {
        OrderItem pending = orderItem(100L, 2, OrderItemStatus.pending);
        sync(List.of(), pending);

        assertEquals(OrderItemStatus.cancelled, pending.getStatus());
    }

    @Test
    void reAddsCancelledLine_revivesItToPending() {
        OrderItem cancelled = orderItem(100L, 2, OrderItemStatus.cancelled);
        sync(List.of(request(2)), cancelled);

        assertEquals(OrderItemStatus.pending, cancelled.getStatus());
        assertEquals(2, cancelled.getQuantity());
        assertEquals(1, savedItems().size());
    }

    /* ── Overflow beyond the not-yet-cooked lines ───────────────────── */

    @Test
    void overflowBeyondExistingPendingLine_mergesOntoIt() {
        OrderItem ready = orderItem(100L, 2, OrderItemStatus.ready);
        OrderItem pending = orderItem(101L, 1, OrderItemStatus.pending);
        // Two request lines with the same key — 4 units in total
        sync(List.of(request(2), request(2)), ready, pending);

        assertEquals(2, ready.getQuantity());
        assertEquals(OrderItemStatus.ready, ready.getStatus());
        assertEquals(2, pending.getQuantity()); // overflow landed on the pending line
        assertEquals(OrderItemStatus.pending, pending.getStatus());
        assertTrue(savedItems().stream().noneMatch(item -> item.getId() == null));
    }

    @Test
    void overflowWithNoPendingLine_createsNewPendingLine() {
        OrderItem ready = orderItem(100L, 2, OrderItemStatus.ready);
        sync(List.of(request(4)), ready);

        assertEquals(2, ready.getQuantity());
        OrderItem created = onlyCreatedLine(savedItems());
        assertEquals(2, created.getQuantity());
        assertEquals(OrderItemStatus.pending, created.getStatus());
    }
}
