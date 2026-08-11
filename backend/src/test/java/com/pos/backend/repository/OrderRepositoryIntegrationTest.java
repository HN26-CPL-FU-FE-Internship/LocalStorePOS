package com.pos.backend.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.User;
import com.pos.backend.util.LocalDateTimeUtil;

@SpringBootTest
@Transactional
class OrderRepositoryIntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;

    @BeforeEach
    void setUp() {
        Category cat = categoryRepository.save(Category.builder()
                .name("Count Test Cat")
                .status(CommonStatus.active)
                .build());

        Item item = itemRepository.save(Item.builder()
                .category(cat)
                .name("Count Test Item")
                .price(new BigDecimal("10.00"))
                .foodType(FoodType.veg)
                .status(ItemStatus.active)
                .build());

        Role role = roleRepository.save(Role.builder().name("COUNT_TEST_ROLE").build());

        User waiter = userRepository.save(User.builder()
                .role(role)
                .firstName("Count")
                .lastName("Test")
                .phoneNumber("9999999991")
                .email("count@test.com")
                .passwordHash("x")
                .status(CommonStatus.active)
                .build());

        RestaurantTable table = restaurantTableRepository.save(RestaurantTable.builder()
                .tableNumber("COUNT-T-1")
                .seats(4)
                .status(TableStatus.available)
                .build());

        // Use a distant future range so existing seed data never interferes.
        periodStart = LocalDateTime.of(2100, 1, 1, 0, 0);
        periodEnd = periodStart.plusDays(4);

        saveOrder("ORD-001", item, waiter, table, periodStart.plusHours(1), OrderStatus.completed,
                OrderPaymentStatus.paid);
        saveOrder("ORD-002", item, waiter, table, periodStart.plusHours(2), OrderStatus.completed,
                OrderPaymentStatus.paid);
        saveOrder("ORD-003", item, waiter, table, periodStart.plusHours(3), OrderStatus.completed,
                OrderPaymentStatus.unpaid);
        saveOrder("ORD-004", item, waiter, table, periodStart.plusHours(4), OrderStatus.cancelled,
                OrderPaymentStatus.paid);
        saveOrder("ORD-005", item, waiter, table, periodStart.minusDays(5), OrderStatus.completed,
                OrderPaymentStatus.paid);
    }

    @Test
    void countCompletedPaidOrdersBetween_shouldCountOnlyCompletedAndPaidOrdersInRange() {
        long count = orderRepository.countCompletedPaidOrdersBetween(periodStart, periodEnd, OrderStatus.completed,
                OrderPaymentStatus.paid);

        assertEquals(2, count);
    }

    @Test
    void countCompletedPaidOrdersBetween_shouldReturnZeroWhenNoMatchingOrders() {
        LocalDateTime emptyStart = LocalDateTimeUtil.getTimeNow().plusYears(1);
        LocalDateTime emptyEnd = emptyStart.plusDays(1);

        long count = orderRepository.countCompletedPaidOrdersBetween(emptyStart, emptyEnd, OrderStatus.completed,
                OrderPaymentStatus.paid);

        assertEquals(0, count);
    }

    private void saveOrder(String orderNumber, Item item, User waiter, RestaurantTable table,
            LocalDateTime orderedAt, OrderStatus status, OrderPaymentStatus paymentStatus) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .orderType(OrderType.dine_in)
                .waiter(waiter)
                .table(table)
                .subtotal(item.getPrice())
                .grandTotal(item.getPrice())
                .status(status)
                .paymentStatus(paymentStatus)
                .orderedAt(orderedAt)
                .build();
        orderRepository.save(order);
    }
}
