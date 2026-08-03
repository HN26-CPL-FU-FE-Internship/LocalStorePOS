package com.pos.backend.specification;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.constant.enums.OrderPaymentStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.OrderType;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Filter.OrderFilter;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.Role;
import com.pos.backend.entity.User;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.RoleRepository;
import com.pos.backend.repository.UserRepository;

@SpringBootTest
@Transactional
class OrderSpecificationTest {

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

    @Autowired
    private CustomerRepository customerRepository;

    @BeforeEach
    void setUp() {
        Category cat = categoryRepository.save(Category.builder()
                .name("Spec Test Cat")
                .status(CommonStatus.active)
                .build());

        Item item = itemRepository.save(Item.builder()
                .category(cat)
                .name("Spec Test Item")
                .price(new BigDecimal("10.00"))
                .foodType(FoodType.veg)
                .status(ItemStatus.active)
                .build());

        Role role = roleRepository.save(Role.builder().name("SPEC_TEST_ROLE").build());

        User waiter = userRepository.save(User.builder()
                .role(role)
                .firstName("Spec")
                .lastName("Waiter")
                .phoneNumber("9999999901")
                .email("spec-waiter@test.com")
                .passwordHash("x")
                .status(CommonStatus.active)
                .build());

        RestaurantTable tableOne = restaurantTableRepository.save(RestaurantTable.builder()
                .tableNumber("TBL-SPEC-1")
                .seats(4)
                .status(TableStatus.available)
                .build());

        RestaurantTable tableTwo = restaurantTableRepository.save(RestaurantTable.builder()
                .tableNumber("TBL-SPEC-2")
                .seats(2)
                .status(TableStatus.available)
                .build());

        Customer alice = customerRepository.save(Customer.builder()
                .name("Spec Customer One")
                .phone("1111111101")
                .status(CommonStatus.active)
                .build());

        Customer bob = customerRepository.save(Customer.builder()
                .name("Spec Customer Two")
                .phone("1111111102")
                .status(CommonStatus.active)
                .build());

        LocalDateTime base = LocalDateTime.of(2101, 1, 1, 12, 0);

        // Dine-in order linked to a table + customer.
        saveOrder("ORD-SPEC-1", "TOK-SPEC-1", OrderType.dine_in, KitchenStatus.new_order, item, waiter, tableOne, alice, base);
        // Take-away order without table/customer (walk-in), already cooking.
        saveOrder("ORD-SPEC-2", "TOK-SPEC-2", OrderType.take_away, KitchenStatus.in_kitchen, item, waiter, null, null, base.plusHours(1));
        // Dine-in order whose identifiers contain literal underscores (used to
        // verify LIKE wildcard escaping).
        saveOrder("ORD_SPEC_3", "TOK_SPEC_3", OrderType.dine_in, KitchenStatus.completed, item, waiter, tableTwo, bob, base.plusHours(2));
    }

    @Test
    void orderNumber_shouldMatchPartialCaseInsensitive() {
        OrderFilter filter = new OrderFilter();
        filter.setOrderNumber("spec-2");

        assertEquals(Set.of("ORD-SPEC-2"), findOrderNumbers(filter));
    }

    @Test
    void tableNumber_shouldMatchLinkedTable() {
        OrderFilter filter = new OrderFilter();
        filter.setTableNumber("tbl-spec-2");

        assertEquals(Set.of("ORD_SPEC_3"), findOrderNumbers(filter));
    }

    @Test
    void search_shouldMatchOrderNumber() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("ORD-SPEC");

        assertEquals(Set.of("ORD-SPEC-1", "ORD-SPEC-2"), findOrderNumbers(filter));
    }

    @Test
    void search_shouldMatchTokenNumber() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("tok-spec-2");

        assertEquals(Set.of("ORD-SPEC-2"), findOrderNumbers(filter));
    }

    @Test
    void search_shouldMatchTableNumber() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("tbl-spec-1");

        assertEquals(Set.of("ORD-SPEC-1"), findOrderNumbers(filter));
    }

    @Test
    void search_shouldMatchCustomerName() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("Spec Customer Two");

        assertEquals(Set.of("ORD_SPEC_3"), findOrderNumbers(filter));
    }

    @Test
    void search_withLiteralPercent_shouldNotMatchEverything() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("%");

        // '%' is escaped, so only identifiers that literally contain '%' would match.
        assertEquals(Set.of(), findOrderNumbers(filter));
    }

    @Test
    void search_withLiteralUnderscore_shouldOnlyMatchRealUnderscores() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("_");

        // Without escaping this would match every order; with escaping only the
        // orders whose identifiers contain a real underscore are returned.
        assertEquals(Set.of("ORD_SPEC_3"), findOrderNumbers(filter));
    }

    @Test
    void kitchenStatus_shouldFilterByStatus() {
        OrderFilter filter = new OrderFilter();
        filter.setKitchenStatus(KitchenStatus.in_kitchen);

        assertEquals(Set.of("ORD-SPEC-2"), findOrderNumbers(filter));
    }

    @Test
    void kitchenStatus_combinedWithSearch_shouldApplyBoth() {
        OrderFilter filter = new OrderFilter();
        filter.setKitchenStatus(KitchenStatus.in_kitchen);
        filter.setSearch("ORD-SPEC");

        // AND semantics: the order must match the status AND the search term.
        assertEquals(Set.of("ORD-SPEC-2"), findOrderNumbers(filter));
    }

    @Test
    void search_withLiteralBackslash_shouldNotMatchAnything() {
        OrderFilter filter = new OrderFilter();
        filter.setSearch("\\");

        // A single backslash is escaped too, so no test order should match.
        assertEquals(Set.of(), findOrderNumbers(filter));
    }

    @Test
    void emptyFilter_shouldReturnAllSavedOrders() {
        // The test orders are dated in 2101 and the query is sorted by orderedAt
        // DESC, so they are guaranteed to be on the first page even when the
        // database already contains seed orders.
        assertEquals(Set.of("ORD-SPEC-1", "ORD-SPEC-2", "ORD_SPEC_3"), findOrderNumbers(new OrderFilter()));
    }

    private Set<String> findOrderNumbers(OrderFilter filter) {
        Page<Order> page = orderRepository.findAll(OrderSpecification.filter(filter),
                PageRequest.of(0, 50, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "orderedAt")));
        // Narrow to the orders created by this test so pre-existing seed data
        // (which may contain its own orders) never affects the assertions.
        return page.getContent().stream()
                .map(Order::getOrderNumber)
                .filter(orderNumber -> orderNumber.startsWith("ORD-SPEC") || orderNumber.startsWith("ORD_SPEC"))
                .collect(Collectors.toSet());
    }

    private void saveOrder(String orderNumber, String tokenNo, OrderType orderType, KitchenStatus kitchenStatus,
            Item item, User waiter, RestaurantTable table, Customer customer, LocalDateTime orderedAt) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .tokenNo(tokenNo)
                .orderType(orderType)
                .waiter(waiter)
                .table(table)
                .customer(customer)
                .subtotal(item.getPrice())
                .grandTotal(item.getPrice())
                .status(OrderStatus.pending)
                .kitchenStatus(kitchenStatus)
                .paymentStatus(OrderPaymentStatus.unpaid)
                .orderedAt(orderedAt)
                .build();
        orderRepository.save(order);
    }
}
