package com.pos.backend.service;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.*;
import com.pos.backend.dto.request.Order.OrderPaymentRequest;
import com.pos.backend.dto.request.POS.CreateOrderItemRequest;
import com.pos.backend.dto.request.POS.CreateOrderRequest;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.entity.*;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.*;
import com.pos.backend.service.Kitchen.KitchenService;
import com.pos.backend.service.Order.OrderService;
import com.pos.backend.service.POS.POSService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test covering the full POS order lifecycle:
 * POS create → kitchen update → payment → verify all calculations.
 *
 * <p>
 * Backend POS.calculator formula (for each item):
 * </p>
 * 
 * <pre>
 *   itemPrice = DB_price          ← ignores unitPrice from request
 *   itemPrice += addon × qty     ← addon price added to item price
 *   itemPrice *= itemQty          ← THEN multiplied by qty
 *   subtotal = Σ itemPrice
 *   tax     += itemPrice × taxRate / 100
 * </pre>
 *
 * <p>
 * Each test method is fully self-contained (creates own order).
 * </p>
 */
/**
 * Runs against a dedicated test database (restaurant_pos_test_db) so the test
 * suite can NEVER wipe the shared dev database. The dev DB was previously
 * destroyed every time these tests ran: the old cleanupDatabase() deleted all
 * rows from every repository (users, roles, categories, items, tables...),
 * which removed seed data and the admin account.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_pos_test_db?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&characterEncoding=UTF-8&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrderFullFlowIntegrationTest {

    @Autowired
    private POSService posService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private KitchenService kitchenService;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private TaxRepository taxRepository;
    @Autowired
    private ItemRepository itemRepository;
    @Autowired
    private AddonRepository addonRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private RestaurantTableRepository restaurantTableRepository;
    @Autowired
    private CouponRepository couponRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private InvoiceRepository invoiceRepository;
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private ApprovalRequestRepository approvalRequestRepository;
    @Autowired
    private HeldOrderRepository heldOrderRepository;
    @Autowired
    private OrderRefundRepository orderRefundRepository;
    @Autowired
    private UserPermissionOverrideRepository userPermissionOverrideRepository;

    // ── Shared test data ──────────────────────────────────────────────

    private Category cat;
    private Tax pct10;
    private Item item120; // $120, 10% tax
    private Item item50; // $50, 10% tax
    private User waiter;
    private RestaurantTable table;

    /** Delete all data in FK-safe order (children before parents). */
    private void cleanupDatabase() {
        reservationRepository.deleteAll();
        approvalRequestRepository.deleteAll();
        heldOrderRepository.deleteAll();
        orderRefundRepository.deleteAll();
        invoiceRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        couponRepository.deleteAll();
        addonRepository.deleteAll();
        itemRepository.deleteAll();
        taxRepository.deleteAll();
        categoryRepository.deleteAll();
        userPermissionOverrideRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        restaurantTableRepository.deleteAll();
    }

    @BeforeAll
    void setUp() {
        cleanupDatabase();

        cat = categoryRepository.save(Category.builder()
                .name("INTG Cat").status(CommonStatus.active).build());

        pct10 = taxRepository.save(Tax.builder()
                .title("VAT 10%").taxRate(new BigDecimal("10.00"))
                .taxType(TaxType.exclusive).status(CommonStatus.active).build());

        item120 = itemRepository.save(Item.builder()
                .category(cat).tax(pct10).name("INTG-P120")
                .price(new BigDecimal("120.00"))
                .foodType(FoodType.veg).status(ItemStatus.active).build());

        item50 = itemRepository.save(Item.builder()
                .category(cat).tax(pct10).name("INTG-P50")
                .price(new BigDecimal("50.00"))
                .foodType(FoodType.non_veg).status(ItemStatus.active).build());

        Role r = roleRepository.save(Role.builder().name("INTG_R").build());

        waiter = userRepository.save(User.builder().role(r)
                .firstName("W").lastName("T")
                .phoneNumber("9999999994").email("wt@intg.test")
                .passwordHash("x").status(CommonStatus.active).build());

        table = restaurantTableRepository.save(RestaurantTable.builder()
                .tableNumber("INTG-T-1").seats(4)
                .status(TableStatus.available).build());
    }

    @AfterAll
    void tearDown() {
        cleanupDatabase();
    }

    // ═══════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════

    static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    static void assertBdEq(BigDecimal expected, BigDecimal actual, String msg) {
        assertEquals(0, expected.compareTo(actual),
                msg + " | expected " + expected + ", got " + actual);
    }

    /** Backend calculateDiscountValue (matches frontend calculateDiscount). */
    static BigDecimal calcDisc(BigDecimal sub, BigDecimal amt, String type) {
        if (amt == null || amt.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;
        if ("percentage".equals(type))
            return sub.multiply(amt.min(bd("100"))).divide(bd("100"), 0, RoundingMode.HALF_UP);
        return amt.min(sub).setScale(0, RoundingMode.HALF_UP);
    }

    /**
     * Backend processPayment grand total (matches frontend calculateOrderTotals).
     */
    static BigDecimal calcGrandTotal(
            BigDecimal sub, BigDecimal dAmt, String dType,
            BigDecimal cAmt, String cType,
            BigDecimal tax, BigDecimal svc, BigDecimal del, BigDecimal tip) {
        BigDecimal dv = calcDisc(sub, dAmt, dType);
        BigDecimal cv = cAmt != null ? calcDisc(sub, cAmt, cType) : BigDecimal.ZERO;
        return sub.subtract(dv).subtract(cv).add(tax).add(svc).add(del).add(tip)
                .max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 1 — Simple dine_in: 1 item x $120
    // ═══════════════════════════════════════════════════════════════════
    //
    // Backend: itemPrice=120×1=120, sub=120
    // tax=120×10%=12, service=6 (5% of 120)
    // grandTotal = 120+12+6 = 138

    @Test
    void test01_createOrder_simpleDineIn() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.dine_in.name())
                .waiterId(waiter.getId()).tableId(table.getId())
                .subtotal(item120.getPrice())
                .taxAmount(item120.getPrice().multiply(pct10.getTaxRate())
                        .divide(bd("100"), 2, RoundingMode.HALF_UP))
                .serviceCharge(bd("6.00"))
                .deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse r = posService.createOrder(req);

        assertBdEq(bd("120.00"), r.getSubtotal(), "subtotal");
        assertBdEq(bd("12.00"), r.getTaxAmount(), "tax");
        assertBdEq(bd("6.00"), r.getServiceCharge(), "service");
        assertBdEq(bd("138.00"), r.getGrandTotal(), "grandTotal");
        assertEquals("pending", r.getStatus());

        System.out.println("✅ TEST 1: $" + r.getGrandTotal()
                + " = $" + r.getSubtotal() + " + $" + r.getTaxAmount()
                + " + $" + r.getServiceCharge());
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 2 — Get order detail: verify items metadata
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test02_getOrderDetail_verifyItems() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.dine_in.name())
                .waiterId(waiter.getId()).tableId(table.getId())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(bd("6.00")).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse created = posService.createOrder(req);
        OrderResponse detail = orderService.getOrderDetail(created.getOrderNumber());

        assertEquals(1, detail.getItems().size());

        var item = detail.getItems().get(0);
        assertEquals(item120.getId(), item.itemId());
        assertEquals(item120.getName(), item.itemName());
        assertBdEq(item120.getPrice(), item.unitPrice(), "unitPrice");
        assertEquals(Integer.valueOf(1), item.quantity());

        System.out.println("✅ TEST 2: Item \"" + item.itemName()
                + "\" qty=" + item.quantity() + " @ $" + item.unitPrice());
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 3 — Kitchen flow: startCooking() → markComplete()
    // Uses actual KitchenService to match real kitchen UI flow
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test03_kitchenServiceFlow() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.dine_in.name())
                .waiterId(waiter.getId()).tableId(table.getId())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(bd("6.00")).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        // Kitchen starts cooking
        var cooking = kitchenService.startCooking(id,
                new com.pos.backend.dto.request.Kitchen.StartCookingRequest(25));
        assertEquals("in_kitchen", cooking.getKitchenStatus());
        assertEquals(Integer.valueOf(25), cooking.getEstimatedMinutes());

        // Kitchen marks complete
        var completed = kitchenService.markComplete(id);
        assertEquals("completed", completed.getKitchenStatus());
        // Normal flow: order stays at preparing (never falls back to pending),
        // and the response carries it for the realtime WebSocket push.
        assertEquals("preparing", completed.getStatus());
        assertEquals("preparing", orderService.getOrderDetail(order.getOrderNumber()).getStatus());

        System.out.println("✅ TEST 3: Kitchen flow (startCooking → complete)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 4 — Cash payment: 10% discount + $5 tip
    // ═══════════════════════════════════════════════════════════════════
    //
    // 1 item $120, tax=$12, no service (take_away)
    // 10% disc → val=12, tip=$5
    // grandTotal = 120-12+12+0+0+5 = 125
    // Cash $130 → balance $5

    @Test
    void test04_cashPayment_discountAndTip() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        // grandTotal before payment = 120 + 12 = 132
        assertBdEq(bd("132.00"), order.getGrandTotal(), "grandTotal before payment");

        // Pay: 10% disc, $5 tip
        BigDecimal expected = calcGrandTotal(
                item120.getPrice(), bd("10"), "percentage", null, null,
                bd("12"), bd("0"), bd("0"), bd("5")); // 125

        OrderPaymentRequest pay = new OrderPaymentRequest();
        pay.setDiscountAmount(bd("10"));
        pay.setDiscountType("percentage");
        pay.setTipAmount(bd("5.00"));
        pay.setPaymentType("cash");
        pay.setGivenAmount(bd("130.00"));

        OrderResponse result = orderService.processPayment(pay, id);

        assertBdEq(expected, result.getGrandTotal(), "grandTotal");
        assertBdEq(bd("130.00"), result.getPaidAmount(), "paidAmount");
        assertBdEq(bd("5.00"), result.getBalanceAmount(), "balance");
        assertEquals("completed", result.getStatus());

        System.out.println("✅ TEST 4: total=$" + result.getGrandTotal()
                + " paid=$130 change=$" + result.getBalanceAmount()
                + " (10% disc + $5 tip)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 5 — Card + fixed coupon ($20) + $3 tip
    // ═══════════════════════════════════════════════════════════════════
    //
    // 1 item $50, tax=$5 (take_away)
    // coupon $20 fixed → val=Min(20,50)=20
    // grandTotal = 50-0-20+5+0+0+3 = 38

    @Test
    void test05_cardPayment_fixedCouponAndTip() {
        Coupon cpn = couponRepository.save(Coupon.builder()
                .code("T5-FX20").discountType(DiscountType.fixed_amount)
                .discountAmount(bd("20.00"))
                .startDate(LocalDate.now().minusDays(1))
                .expiryDate(LocalDate.now().plusYears(1))
                .status(CouponStatus.active).build());

        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item50.getPrice()).taxAmount(bd("5.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item50.getId()).itemName(item50.getName())
                        .unitPrice(item50.getPrice()).quantity(1)
                        .lineTotal(item50.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        assertBdEq(bd("55.00"), order.getGrandTotal(), "initial grandTotal");

        BigDecimal expected = calcGrandTotal(
                item50.getPrice(), bd("0"), "percentage",
                bd("20"), "fixed_amount",
                bd("5"), bd("0"), bd("0"), bd("3")); // 38

        OrderPaymentRequest pay = new OrderPaymentRequest();
        pay.setDiscountAmount(BigDecimal.ZERO);
        pay.setDiscountType("percentage");
        pay.setTipAmount(bd("3.00"));
        pay.setCouponCode("T5-FX20");
        pay.setPaymentType("card");
        pay.setGivenAmount(BigDecimal.ZERO);

        OrderResponse result = orderService.processPayment(pay, order.getId());

        assertBdEq(expected, result.getGrandTotal(), "grandTotal");
        assertEquals("completed", result.getStatus());

        System.out.println("✅ TEST 5: card $" + result.getGrandTotal()
                + " (coupon $20 + $3 tip)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 6 — Delivery cash: 10% discount + 15% coupon
    // ═══════════════════════════════════════════════════════════════════
    //
    // 1 item $120, tax=$12, delivery=$8
    // 10% disc → val=12, 15% coupon → val=18
    // grandTotal = 120-12-18+12+0+8+0 = 110

    @Test
    void test06_deliveryCash_percentCouponAndDiscount() {
        Coupon cpn = couponRepository.save(Coupon.builder()
                .code("T6-P15").discountType(DiscountType.percentage)
                .discountAmount(bd("15.00"))
                .startDate(LocalDate.now().minusDays(1))
                .expiryDate(LocalDate.now().plusYears(1))
                .status(CouponStatus.active).build());

        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.delivery.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(bd("8.00"))
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        assertBdEq(bd("140.00"), order.getGrandTotal(), "initial grandTotal");

        BigDecimal expected = calcGrandTotal(
                item120.getPrice(), bd("10"), "percentage",
                bd("15"), "percentage",
                bd("12"), bd("0"), bd("8"), bd("0")); // 110

        OrderPaymentRequest pay = new OrderPaymentRequest();
        pay.setDiscountAmount(bd("10"));
        pay.setDiscountType("percentage");
        pay.setTipAmount(BigDecimal.ZERO);
        pay.setCouponCode("T6-P15");
        pay.setPaymentType("cash");
        pay.setGivenAmount(bd("110.00"));

        OrderResponse result = orderService.processPayment(pay, order.getId());

        assertBdEq(expected, result.getGrandTotal(), "grandTotal");
        assertEquals("completed", result.getStatus());

        System.out.println("✅ TEST 6: cash $" + result.getGrandTotal()
                + " (10% disc + 15% coupon)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 7 — Formula: backend = frontend (5 scenarios)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test07_formulaMatchesFrontend() {
        record Case(String name,
                BigDecimal sub, BigDecimal dAmt, String dType,
                BigDecimal cAmt, String cType,
                BigDecimal tax, BigDecimal svc, BigDecimal del, BigDecimal tip,
                BigDecimal expected) {
        }

        List<Case> cases = List.of(
                new Case("1. Dine-in no modifiers",
                        bd("100"), bd("0"), "percentage", null, null,
                        bd("10"), bd("5"), bd("0"), bd("0"), bd("115.00")),
                new Case("2. 10% disc + $5 coupon + tip delivery",
                        bd("100"), bd("10"), "percentage", bd("5"), "fixed_amount",
                        bd("10"), bd("0"), bd("5"), bd("8"), bd("108.00")),
                new Case("3. 20% coupon dine_in",
                        bd("200"), bd("0"), "percentage", bd("20"), "percentage",
                        bd("16"), bd("10"), bd("0"), bd("0"), bd("186.00")),
                new Case("4. Fixed $15 disc take_away",
                        bd("80"), bd("15"), "fixed_amount", null, null,
                        bd("8"), bd("0"), bd("0"), bd("0"), bd("73.00")),
                new Case("5. 10% + 10% coupon + tip delivery",
                        bd("150"), bd("10"), "percentage", bd("10"), "percentage",
                        bd("12"), bd("0"), bd("7"), bd("5"), bd("144.00")));

        for (Case c : cases) {
            BigDecimal actual = calcGrandTotal(
                    c.sub, c.dAmt, c.dType, c.cAmt, c.cType,
                    c.tax, c.svc, c.del, c.tip);
            assertBdEq(c.expected, actual, c.name);
            System.out.println("✅ " + c.name + ": $" + actual);
        }
        System.out.println("✅ TEST 7: All " + cases.size() + " formula cases match frontend");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 8 — Re-order a ready item: updateOrder splits the extra
    // amount into a brand-new pending line (kitchen split)
    // ═══════════════════════════════════════════════════════════════════
    //
    // Create 2× $120 → kitchen marks complete (items become ready)
    // → waiter adds 1 more via updateOrder.
    // The ready line keeps its id & status at ×2, and the extra amount
    // spills into a new pending ×1 line — only the extra goes to the
    // kitchen. Totals are recomputed from the full new cart (3 × 120).

    @Test
    void test08_updateOrder_readyItemReordered() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.dine_in.name())
                .waiterId(waiter.getId()).tableId(table.getId())
                .subtotal(item120.getPrice().multiply(bd("2")))
                .taxAmount(bd("24.00"))
                .serviceCharge(bd("12.00"))
                .deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(2)
                        .lineTotal(item120.getPrice().multiply(bd("2"))).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        // Kitchen finishes the first batch → the item line becomes ready
        kitchenService.markComplete(id);

        // Waiter re-orders the same item, now wanting 3 in total
        CreateOrderRequest updateReq = CreateOrderRequest.builder()
                .orderType(OrderType.dine_in.name())
                .waiterId(waiter.getId()).tableId(table.getId())
                .subtotal(item120.getPrice().multiply(bd("3")))
                .taxAmount(bd("36.00"))
                .serviceCharge(bd("18.00"))
                .deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(3)
                        .lineTotal(item120.getPrice().multiply(bd("3"))).build()))
                .build();

        OrderResponse updated = posService.updateOrder(order.getOrderNumber(), updateReq);

        // Totals are recomputed from the full new cart: 3 × 120 = 360
        assertBdEq(bd("360.00"), updated.getSubtotal(), "subtotal after update");
        assertBdEq(bd("36.00"), updated.getTaxAmount(), "tax after update");
        assertBdEq(bd("18.00"), updated.getServiceCharge(), "service after update");
        assertBdEq(bd("414.00"), updated.getGrandTotal(), "grandTotal after update");

        // The split: one ready line (the cooked batch) + one pending line (the extra)
        OrderResponse detail = orderService.getOrderDetail(order.getOrderNumber());
        assertEquals(2, detail.getItems().size(), "re-order should produce two split lines");

        var readyLine = detail.getItems().stream()
                .filter(i -> "ready".equals(i.status())).findFirst().orElseThrow();
        var pendingLine = detail.getItems().stream()
                .filter(i -> "pending".equals(i.status())).findFirst().orElseThrow();

        assertEquals(Integer.valueOf(2), readyLine.quantity(), "ready line keeps the cooked qty");
        assertEquals(Integer.valueOf(1), pendingLine.quantity(), "pending line carries only the extra");
        assertEquals(item120.getId(), readyLine.itemId());
        assertEquals(item120.getId(), pendingLine.itemId());
        assertEquals(item120.getName(), pendingLine.itemName());

        System.out.println("✅ TEST 8: ready ×2 + pending ×1 after re-ordering 3 of "
                + item120.getName() + " ($" + updated.getGrandTotal() + " total)");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 9 — Mark done without pressing Play: the order must not stay
    // pending. markComplete() on a pending order promotes it to preparing
    // (kitchenStatus completed, items ready) so the lifecycle can continue.
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test09_markCompleteWithoutStartCooking_promotesPendingToPreparing() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        assertEquals("pending", order.getStatus());

        // Kitchen marks the order done directly — no startCooking() first.
        var completed = kitchenService.markComplete(order.getId());
        assertEquals("completed", completed.getKitchenStatus());
        assertEquals("preparing", completed.getStatus(),
                "markComplete response must carry the promoted status for WebSocket push");

        OrderResponse detail = orderService.getOrderDetail(order.getOrderNumber());
        assertEquals("preparing", detail.getStatus(),
                "order must leave pending when the kitchen finishes it without starting");
        assertEquals(1, detail.getItems().size());
        assertEquals("ready", detail.getItems().get(0).status(),
                "items must be ready after markComplete");

        System.out.println("✅ TEST 9: markComplete without Play → status="
                + detail.getStatus() + ", items=ready");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 10 — markComplete on a cancelled order must be rejected at the
    // backend (the frontend hides the button, but a stale/malicious request
    // must not resurrect a cancelled order).
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test10_markComplete_onCancelledOrder_throws() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        kitchenService.cancel(id);
        assertEquals("cancelled", orderService.getOrderDetail(order.getOrderNumber()).getStatus());

        AppException ex = assertThrows(AppException.class, () -> kitchenService.markComplete(id));
        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());

        System.out.println("✅ TEST 10: markComplete on cancelled order rejected");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 11 — markComplete on a completed (paid) order must be rejected.
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test11_markComplete_onCompletedOrder_throws() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        // Pay the full amount → order becomes completed
        OrderPaymentRequest pay = new OrderPaymentRequest();
        pay.setDiscountAmount(BigDecimal.ZERO);
        pay.setDiscountType("percentage");
        pay.setTipAmount(BigDecimal.ZERO);
        pay.setPaymentType("cash");
        pay.setGivenAmount(bd("132.00"));
        OrderResponse paid = orderService.processPayment(pay, id);
        assertEquals("completed", paid.getStatus());

        AppException ex = assertThrows(AppException.class, () -> kitchenService.markComplete(id));
        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());

        System.out.println("✅ TEST 11: markComplete on completed order rejected");
    }

    // ═══════════════════════════════════════════════════════════════════
    // TEST 12 — Duplicate markComplete: the second call (kitchenStatus already
    // completed) must be rejected so the "Order Ready" notification is not
    // sent twice.
    // ═══════════════════════════════════════════════════════════════════

    @Test
    void test12_markCompleteTwice_secondCallThrows() {
        CreateOrderRequest req = CreateOrderRequest.builder()
                .orderType(OrderType.take_away.name())
                .subtotal(item120.getPrice()).taxAmount(bd("12.00"))
                .serviceCharge(BigDecimal.ZERO).deliveryCharge(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .items(List.of(CreateOrderItemRequest.builder()
                        .itemId(item120.getId()).itemName(item120.getName())
                        .unitPrice(item120.getPrice()).quantity(1)
                        .lineTotal(item120.getPrice()).build()))
                .build();

        OrderResponse order = posService.createOrder(req);
        Long id = order.getId();

        // First call succeeds
        kitchenService.markComplete(id);
        assertEquals("preparing", orderService.getOrderDetail(order.getOrderNumber()).getStatus());

        // Second call is rejected — kitchenStatus is already completed
        AppException ex = assertThrows(AppException.class, () -> kitchenService.markComplete(id));
        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_OR_CANCELLED, ex.getErrorCode());

        System.out.println("✅ TEST 12: duplicate markComplete rejected");
    }
}
