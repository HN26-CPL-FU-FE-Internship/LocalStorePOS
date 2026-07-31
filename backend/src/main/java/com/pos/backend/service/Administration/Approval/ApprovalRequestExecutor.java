package com.pos.backend.service.Administration.Approval;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.backend.constant.ErrorCode;
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
import com.pos.backend.exception.AppException;
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

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Executes the underlying business action when an approval request is
 * approved. The original action payload is stored in the approval request's
 * {@code additionalData} (JSON) so it can be replayed here.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApprovalRequestExecutor {

    ObjectMapper objectMapper;
    OrderService orderService;
    OrderItemService orderItemService;
    KitchenService kitchenService;
    ItemService itemService;
    CustomerService customerService;
    CategoryService categoryService;
    AddonService addonService;
    CouponService couponService;
    InvoiceService invoiceService;
    TaxSettingService taxSettingService;
    RestaurantTableService restaurantTableService;
    TableAreaService tableAreaService;
    ReservationService reservationService;
    UserService userService;
    PermissionService permissionService;
    PaymentService paymentService;
    AuditLogService auditLogService;

    /**
     * Execute the approved request. Failures are caught, audit-logged with a
     * FAILED status, but do NOT roll back the approval itself.
     */
    @Transactional
    public void execute(ApprovalRequest request) {
        try {
            switch (request.getRequestType()) {
                case CANCEL_INVOICE -> cancelInvoice(request);
                case REOPEN_PAID_INVOICE -> reopenPaidInvoice(request);
                case DISCOUNT_EXCEEDS_THRESHOLD -> discountExceedsThreshold(request);
                case CANCEL_KITCHEN_TICKET -> cancelKitchenTicket(request);
                case CANCEL_ITEM_AFTER_KITCHEN -> cancelItemAfterKitchen(request);
                case PRICE_CHANGE -> priceChange(request);
                case PERMISSION_CHANGE -> permissionChange(request);
                case USER_CREATE_DELETE -> userCreateDelete(request);
                case DELETE_IMPORTANT_DATA -> deleteImportantData(request);
                case REFUND_RETURN -> refundReturn(request);
                case COMPLIMENTARY -> complimentary(request);
                default -> log.warn("No executor for approval request type {}", request.getRequestType());
            }
        } catch (Exception e) {
            log.error("Failed to execute approval request {} ({})",
                    request.getId(), request.getRequestType(), e);
            auditLogService.log(null, AuditAction.APPROVAL_REQUEST_APPROVED,
                    "ADMINISTRATION", "ApprovalRequest", request.getId(),
                    "Approval request executed but FAILED: " + request.getDescription()
                            + " | Error: " + e.getMessage(),
                    null, null, "FAILED", null);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Per-type executors                                                */
    /* ------------------------------------------------------------------ */

    private void cancelInvoice(ApprovalRequest request) {
        Long orderId = targetId(request, parseData(request));
        orderService.updateStatus(new OrderUpdateStatusRequest(OrderStatus.cancelled), orderId);
    }

    private void reopenPaidInvoice(ApprovalRequest request) {
        Long orderId = targetId(request, parseData(request));
        orderService.reopenInvoice(orderId);
    }

    private void discountExceedsThreshold(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        Long orderId = longField(data, "orderId");
        Object payment = data.get("paymentRequest");
        if (payment == null) {
            throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
        OrderPaymentRequest paymentRequest = objectMapper.convertValue(payment, OrderPaymentRequest.class);
        orderService.processPayment(paymentRequest, orderId);
    }

    private void cancelKitchenTicket(ApprovalRequest request) {
        Long orderId = targetId(request, parseData(request));
        kitchenService.cancel(orderId);
    }

    private void cancelItemAfterKitchen(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        Long orderItemId = longField(data, "orderItemId");
        orderItemService.updateStatus(orderItemId,
                UpdateOrderItemRequest.builder().status(OrderItemStatus.cancelled).build());
    }

    private void priceChange(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        Long itemId = longField(data, "itemId");
        Object itemRequestData = data.get("itemRequest");
        if (itemRequestData != null) {
            // Full item update replayed after approval (image not included).
            ItemRequest itemRequest = objectMapper.convertValue(itemRequestData, ItemRequest.class);
            itemService.updateItem(itemId, itemRequest);
            return;
        }
        Object newPrice = data.get("newPrice");
        if (newPrice == null) {
            throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
        itemService.updatePrice(itemId, new BigDecimal(String.valueOf(newPrice)));
    }

    private void permissionChange(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        Long roleId = longField(data, "roleId");
        String action = data.get("action") == null ? "" : String.valueOf(data.get("action"));

        if ("RESET_PERMISSIONS".equalsIgnoreCase(action)) {
            permissionService.resetRolePermissions(roleId);
            return;
        }
        if ("DELETE_ROLE".equalsIgnoreCase(action)) {
            permissionService.deleteRole(roleId);
            return;
        }

        Object permissions = data.get("permissions");
        if (permissions == null) {
            throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
        RolePermissionsUpdateRequest req = new RolePermissionsUpdateRequest();
        req.setPermissions(objectMapper.convertValue(permissions,
                new TypeReference<List<RolePermissionsUpdateRequest.PermissionModuleEntry>>() {
                }));
        permissionService.updateRolePermissions(roleId, req);
    }

    private void userCreateDelete(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        String action = data.get("action") == null ? "" : String.valueOf(data.get("action"));
        if ("CREATE_USER".equalsIgnoreCase(action)) {
            Object payload = data.get("userRequest");
            if (payload == null) {
                payload = data.get("payload");
            }
            if (payload == null) {
                throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
            }
            UserCreationRequest userRequest = objectMapper.convertValue(payload, UserCreationRequest.class);
            userService.createUser(userRequest, null);
        } else {
            Long userId = longField(data, "userId");
            userService.deleteUser(userId);
        }
    }

    private void deleteImportantData(ApprovalRequest request) {
        String targetType = request.getTargetType();
        Long targetId = request.getTargetId();
        if (targetId == null) {
            throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
        switch (targetType == null ? "" : targetType.toUpperCase()) {
            case "ITEM" -> itemService.deleteItem(targetId);
            case "CUSTOMER" -> customerService.deleteCustomer(targetId);
            case "CATEGORY" -> categoryService.deleteCategory(targetId);
            case "ADDON" -> addonService.deleteAddon(targetId);
            case "COUPON" -> couponService.deleteCoupon(targetId);
            case "INVOICE" -> invoiceService.deleteInvoice(targetId);
            case "TAX" -> taxSettingService.deleteTax(targetId);
            case "TABLE" -> restaurantTableService.deleteTable(targetId);
            case "TABLE_AREA" -> tableAreaService.deleteArea(targetId);
            case "RESERVATION" -> reservationService.deleteReservation(targetId);
            case "ROLE" -> permissionService.deleteRole(targetId);
            default -> throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
    }

    private void refundReturn(ApprovalRequest request) {
        Map<String, Object> data = parseData(request);
        Long paymentId = longField(data, "paymentId");
        paymentService.refundPayment(paymentId);
    }

    private void complimentary(ApprovalRequest request) {
        // No complimentary flag exists on order items yet; record the approval
        // execution so it is audited without failing the flow.
        auditLogService.log(null, AuditAction.DISCOUNT_APPLIED,
                "ADMINISTRATION", "ApprovalRequest", request.getId(),
                "Complimentary approval executed (no-op): " + request.getDescription(),
                null, null, "SUCCESS", null);
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                           */
    /* ------------------------------------------------------------------ */

    private Long targetId(ApprovalRequest request, Map<String, Object> data) {
        Object id = data.get("targetId");
        if (id instanceof Number number) {
            return number.longValue();
        }
        if (request.getTargetId() != null) {
            return request.getTargetId();
        }
        throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
    }

    private Long longField(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
    }

    private Map<String, Object> parseData(ApprovalRequest request) {
        String raw = request.getAdditionalData();
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            throw new AppException(ErrorCode.APPROVAL_REQUEST_NOT_FOUND);
        }
    }
}
