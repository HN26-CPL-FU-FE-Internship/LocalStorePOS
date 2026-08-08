package com.pos.backend.service.Administration.Approval;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.constant.enums.OrderItemStatus;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.dto.request.Administration.RolePermissionsUpdateRequest;
import com.pos.backend.dto.request.Item.ItemRequest;
import com.pos.backend.dto.request.Order.OrderPaymentRequest;
import com.pos.backend.dto.request.Order.OrderUpdateStatusRequest;
import com.pos.backend.dto.request.OrderItem.UpdateOrderItemRequest;
import com.pos.backend.dto.request.User.UserCreationRequest;
import com.pos.backend.entity.ApprovalRequest;
import com.pos.backend.entity.User;
import com.pos.backend.repository.ApprovalRequestRepository;
import com.pos.backend.service.Addon.AddonService;
import com.pos.backend.service.Administration.Permission.PermissionService;
import com.pos.backend.service.Administration.UserServices.UserService;
import com.pos.backend.service.Audit.AuditLogService;
import com.pos.backend.service.Category.CategoryService;
import com.pos.backend.service.Coupon.CouponService;
import com.pos.backend.service.Customer.CustomerService;
import com.pos.backend.service.Invoice.InvoiceService;
import com.pos.backend.service.Item.ItemService;
import com.pos.backend.service.Kitchen.KitchenService;
import com.pos.backend.service.Order.OrderService;
import com.pos.backend.service.OrderItem.OrderItemService;
import com.pos.backend.service.Payment.PaymentService;
import com.pos.backend.service.Settings.TaxSettingService;
import com.pos.backend.service.Table.ReservationService;
import com.pos.backend.service.Table.RestaurantTableService;
import com.pos.backend.service.Table.TableAreaService;

@ExtendWith(MockitoExtension.class)
class ApprovalRequestExecutorTest {

    @Mock private OrderService orderService;
    @Mock private OrderItemService orderItemService;
    @Mock private KitchenService kitchenService;
    @Mock private ItemService itemService;
    @Mock private CustomerService customerService;
    @Mock private CategoryService categoryService;
    @Mock private AddonService addonService;
    @Mock private CouponService couponService;
    @Mock private InvoiceService invoiceService;
    @Mock private TaxSettingService taxSettingService;
    @Mock private RestaurantTableService restaurantTableService;
    @Mock private TableAreaService tableAreaService;
    @Mock private ReservationService reservationService;
    @Mock private UserService userService;
    @Mock private PermissionService permissionService;
    @Mock private PaymentService paymentService;
    @Mock private AuditLogService auditLogService;
    @Mock private ApprovalRequestRepository approvalRequestRepository;
    @Mock private PlatformTransactionManager transactionManager;

    /** Executor built manually so a real ObjectMapper is used for JSON parsing. */
    private ApprovalRequestExecutor executor;

    @BeforeEach
    void setUp() {
        // This Spring version's TransactionTemplate calls commit()/rollback()
        // directly on the manager, so a plain TransactionStatus mock suffices.
        when(transactionManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
        executor = new ApprovalRequestExecutor(
                new ObjectMapper(),
                orderService,
                orderItemService,
                kitchenService,
                itemService,
                customerService,
                categoryService,
                addonService,
                couponService,
                invoiceService,
                taxSettingService,
                restaurantTableService,
                tableAreaService,
                reservationService,
                userService,
                permissionService,
                paymentService,
                auditLogService,
                approvalRequestRepository,
                transactionManager);
        executor.init();
    }

    /* ------------------------------------------------------------ */
    /*  Order-related executors                                     */
    /* ------------------------------------------------------------ */

    @Test
    void execute_cancelInvoice_delegatesToOrderService() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_INVOICE,
                "{\"targetId\":42}", null);

        executor.execute(request);

        ArgumentCaptor<OrderUpdateStatusRequest> captor =
                ArgumentCaptor.forClass(OrderUpdateStatusRequest.class);
        verify(orderService).updateStatus(captor.capture(), eq(42L));
        assertEquals(OrderStatus.cancelled, captor.getValue().getStatus());
        assertEquals(ApprovalStatus.APPROVED, request.getStatus());
        verify(approvalRequestRepository, never()).save(any(ApprovalRequest.class));
        verify(transactionManager).commit(any(TransactionStatus.class));
    }

    @Test
    void execute_cancelInvoice_fallsBackToRequestTargetIdWhenDataAbsent() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_INVOICE, null, 42L);

        executor.execute(request);

        verify(orderService).updateStatus(any(OrderUpdateStatusRequest.class), eq(42L));
    }

    @Test
    void execute_reopenPaidInvoice_delegatesToOrderService() {
        ApprovalRequest request = request(ApprovalRequestType.REOPEN_PAID_INVOICE,
                "{\"targetId\":42}", null);

        executor.execute(request);

        verify(orderService).reopenInvoice(42L);
    }

    @Test
    void execute_discountExceedsThreshold_delegatesToOrderService() {
        ApprovalRequest request = request(ApprovalRequestType.DISCOUNT_EXCEEDS_THRESHOLD,
                "{\"orderId\":10,\"paymentRequest\":{\"discountAmount\":5,"
                        + "\"discountType\":\"amount\",\"paymentType\":\"cash\","
                        + "\"givenAmount\":100}}",
                null);

        executor.execute(request);

        verify(orderService).processPayment(any(OrderPaymentRequest.class), eq(10L));
    }

    @Test
    void execute_discountExceedsThreshold_missingPaymentRequest_marksFailed() {
        ApprovalRequest request = request(ApprovalRequestType.DISCOUNT_EXCEEDS_THRESHOLD,
                "{\"orderId\":10}", null);

        executor.execute(request);

        assertFailed(request);
    }

    @Test
    void execute_cancelKitchenTicket_delegatesToKitchenService() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_KITCHEN_TICKET,
                "{\"targetId\":42}", null);

        executor.execute(request);

        verify(kitchenService).cancel(42L);
    }

    @Test
    void execute_cancelItemAfterKitchen_delegatesToOrderItemService() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_ITEM_AFTER_KITCHEN,
                "{\"orderItemId\":9}", null);

        executor.execute(request);

        ArgumentCaptor<UpdateOrderItemRequest> captor =
                ArgumentCaptor.forClass(UpdateOrderItemRequest.class);
        verify(orderItemService).updateStatus(eq(9L), captor.capture());
        assertEquals(OrderItemStatus.cancelled, captor.getValue().getStatus());
    }

    /* ------------------------------------------------------------ */
    /*  Price change                                                 */
    /* ------------------------------------------------------------ */

    @Test
    void execute_priceChange_withItemRequest_delegatesToUpdateItem() {
        ApprovalRequest request = request(ApprovalRequestType.PRICE_CHANGE,
                "{\"itemId\":5,\"itemRequest\":{\"name\":\"Pizza\",\"price\":12.50}}", null);

        executor.execute(request);

        verify(itemService).updateItem(eq(5L), any(ItemRequest.class));
        verify(itemService, never()).updatePrice(any(), any());
    }

    @Test
    void execute_priceChange_withNewPrice_delegatesToUpdatePrice() {
        ApprovalRequest request = request(ApprovalRequestType.PRICE_CHANGE,
                "{\"itemId\":5,\"newPrice\":12.50}", null);

        executor.execute(request);

        verify(itemService).updatePrice(eq(5L), eq(new BigDecimal("12.5")));
        verify(itemService, never()).updateItem(any(), any());
    }

    @Test
    void execute_priceChange_missingData_marksFailed() {
        ApprovalRequest request = request(ApprovalRequestType.PRICE_CHANGE, "{\"itemId\":5}", null);

        executor.execute(request);

        assertFailed(request);
    }

    /* ------------------------------------------------------------ */
    /*  Permission & user admin                                     */
    /* ------------------------------------------------------------ */

    @Test
    void execute_permissionChange_delegatesToUpdateRolePermissions() {
        ApprovalRequest request = request(ApprovalRequestType.PERMISSION_CHANGE,
                "{\"roleId\":3,\"permissions\":[{\"module\":\"Products\",\"view\":true,"
                        + "\"add\":false,\"edit\":false,\"delete_\":false,\"export_\":false,"
                        + "\"approvedVoid\":false}]}",
                null);

        executor.execute(request);

        verify(permissionService).updateRolePermissions(
                eq(3L), any(RolePermissionsUpdateRequest.class));
    }

    @Test
    void execute_permissionChange_resetAction_delegatesToResetRolePermissions() {
        ApprovalRequest request = request(ApprovalRequestType.PERMISSION_CHANGE,
                "{\"roleId\":3,\"action\":\"RESET_PERMISSIONS\"}", null);

        executor.execute(request);

        verify(permissionService).resetRolePermissions(3L);
        verify(permissionService, never()).updateRolePermissions(any(), any());
    }

    @Test
    void execute_permissionChange_deleteRoleAction_delegatesToDeleteRole() {
        ApprovalRequest request = request(ApprovalRequestType.PERMISSION_CHANGE,
                "{\"roleId\":3,\"action\":\"DELETE_ROLE\"}", null);

        executor.execute(request);

        verify(permissionService).deleteRole(3L);
    }

    @Test
    void execute_userCreateDelete_createAction_delegatesToCreateUser() {
        ApprovalRequest request = request(ApprovalRequestType.USER_CREATE_DELETE,
                "{\"action\":\"CREATE_USER\",\"userRequest\":{\"firstName\":\"New\","
                        + "\"lastName\":\"User\",\"email\":\"new@example.com\","
                        + "\"phoneNumber\":\"0123456789\",\"password\":\"password123\","
                        + "\"role\":2}}",
                null);

        executor.execute(request);

        verify(userService).createUser(any(UserCreationRequest.class), isNull());
        verify(userService, never()).deleteUser(any());
    }

    @Test
    void execute_userCreateDelete_deleteAction_delegatesToDeleteUser() {
        ApprovalRequest request = request(ApprovalRequestType.USER_CREATE_DELETE,
                "{\"action\":\"DELETE_USER\",\"userId\":9}", null);

        executor.execute(request);

        verify(userService).deleteUser(9L);
    }

    @Test
    void execute_userCreateDelete_payloadFallbackField_delegatesToCreateUser() {
        ApprovalRequest request = request(ApprovalRequestType.USER_CREATE_DELETE,
                "{\"action\":\"CREATE_USER\",\"payload\":{\"firstName\":\"New\","
                        + "\"lastName\":\"User\",\"email\":\"new@example.com\","
                        + "\"phoneNumber\":\"0123456789\",\"password\":\"password123\","
                        + "\"role\":2}}",
                null);

        executor.execute(request);

        verify(userService).createUser(any(UserCreationRequest.class), isNull());
    }

    /* ------------------------------------------------------------ */
    /*  Delete important data / refund                              */
    /* ------------------------------------------------------------ */

    @Test
    void execute_deleteImportantData_delegatesPerTargetType() {
        ApprovalRequest itemRequest = request(ApprovalRequestType.DELETE_IMPORTANT_DATA,
                null, 4L);
        itemRequest.setTargetType("ITEM");
        executor.execute(itemRequest);
        verify(itemService).deleteItem(4L);

        ApprovalRequest customerRequest = request(ApprovalRequestType.DELETE_IMPORTANT_DATA,
                null, 5L);
        customerRequest.setTargetType("customer");
        executor.execute(customerRequest);
        verify(customerService).deleteCustomer(5L);

        ApprovalRequest tableRequest = request(ApprovalRequestType.DELETE_IMPORTANT_DATA, null, 6L);
        tableRequest.setTargetType("TABLE");
        executor.execute(tableRequest);
        verify(restaurantTableService).deleteTable(6L);
    }

    @Test
    void execute_deleteImportantData_roleTarget_delegatesToDeleteRole() {
        ApprovalRequest request = request(ApprovalRequestType.DELETE_IMPORTANT_DATA, null, 3L);
        request.setTargetType("ROLE");

        executor.execute(request);

        verify(permissionService).deleteRole(3L);
    }

    @Test
    void execute_deleteImportantData_unknownTargetType_marksFailed() {
        ApprovalRequest request = request(ApprovalRequestType.DELETE_IMPORTANT_DATA, null, 4L);
        request.setTargetType("UNKNOWN_ENTITY");

        executor.execute(request);

        assertFailed(request);
    }

    @Test
    void execute_complimentary_logsNoOpAuditAndStaysApproved() {
        ApprovalRequest request = request(ApprovalRequestType.COMPLIMENTARY, null, null);

        executor.execute(request);

        assertEquals(ApprovalStatus.APPROVED, request.getStatus());
        verify(approvalRequestRepository, never()).save(any(ApprovalRequest.class));
        verify(auditLogService).log(isNull(), eq(AuditAction.DISCOUNT_APPLIED),
                any(), any(), eq(request.getId()), any(), any(), any(), eq("SUCCESS"), any());
    }

    @Test
    void execute_nullRequestType_marksFailed() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_INVOICE, null, 42L);
        request.setRequestType(null);

        executor.execute(request);

        assertFailed(request);
    }

    @Test
    void execute_refundReturn_delegatesToPaymentService() {
        ApprovalRequest request = request(ApprovalRequestType.REFUND_RETURN,
                "{\"paymentId\":2}", null);

        executor.execute(request);

        verify(paymentService).refundPayment(2L);
    }

    /* ------------------------------------------------------------ */
    /*  Failure handling                                             */
    /* ------------------------------------------------------------ */

    @Test
    void execute_whenActionThrows_marksRequestFailedAndAudits() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_INVOICE,
                "{\"targetId\":42}", null);
        org.mockito.Mockito.doThrow(new RuntimeException("boom"))
                .when(orderService).updateStatus(any(OrderUpdateStatusRequest.class), any());

        executor.execute(request);

        assertFailed(request);
    }

    @Test
    void execute_whenAdditionalDataIsInvalidJson_marksFailed() {
        ApprovalRequest request = request(ApprovalRequestType.CANCEL_INVOICE,
                "{not valid json", null);

        executor.execute(request);

        assertFailed(request);
    }

    /* ------------------------------------------------------------ */
    /*  Helpers                                                      */
    /* ------------------------------------------------------------ */

    private void assertFailed(ApprovalRequest request) {
        assertEquals(ApprovalStatus.FAILED, request.getStatus());
        verify(approvalRequestRepository).save(request);
        // The REQUIRES_NEW action transaction was rolled back before the
        // request was flipped to FAILED in the caller's transaction.
        verify(transactionManager).rollback(any(TransactionStatus.class));
        verify(auditLogService).log(isNull(), eq(AuditAction.APPROVAL_REQUEST_APPROVED),
                any(), any(), eq(request.getId()), any(), any(), any(), eq("FAILED"), any());
    }

    private ApprovalRequest request(ApprovalRequestType type, String additionalData,
            Long targetId) {
        return ApprovalRequest.builder()
                .id(7L)
                .requestType(type)
                .status(ApprovalStatus.APPROVED)
                .requestedBy(User.builder()
                        .id(1L)
                        .firstName("Alice")
                        .lastName("Smith")
                        .email("alice@example.com")
                        .build())
                .description("Approval request " + type)
                .reason("Some reason")
                .targetId(targetId)
                .additionalData(additionalData)
                .build();
    }
}
