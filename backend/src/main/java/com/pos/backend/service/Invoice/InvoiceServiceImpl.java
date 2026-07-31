package com.pos.backend.service.Invoice;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.InvoiceStatus;
import com.pos.backend.dto.response.Invoice.InvoiceDetailResponse;
import com.pos.backend.dto.response.Invoice.InvoiceItemLineResponse;
import com.pos.backend.dto.response.Invoice.InvoiceListItemResponse;
import com.pos.backend.entity.Invoice;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.InvoiceRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.service.Common.PageResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceListItemResponse> getInvoices(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            InvoiceStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Invoice> invoicePage = invoiceRepository.search(normalizedSearch, status, pageable);

        List<InvoiceListItemResponse> invoices = invoicePage.getContent().stream().map(this::toListResponse).toList();

        return PageResponse.<InvoiceListItemResponse>builder()
                .items(invoices)
                .page(page)
                .size(size)
                .totalElements(invoicePage.getTotalElements())
                .totalPages(invoicePage.getTotalPages())
                .first(invoicePage.isFirst())
                .last(invoicePage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDetailResponse getInvoice(Long id) {
        Invoice invoice = findInvoiceOrThrow(id);
        return toDetailResponse(invoice);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = findInvoiceOrThrow(id);
        invoiceRepository.delete(invoice);
    }

    private Invoice findInvoiceOrThrow(Long id) {
        return invoiceRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
    }

    private InvoiceListItemResponse toListResponse(Invoice invoice) {
        Order order = invoice.getOrder();

        return InvoiceListItemResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(invoice.getCustomer() != null ? invoice.getCustomer().getId() : null)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : "Walk-in Customer")
                .customerAvatarPath(invoice.getCustomer() != null ? invoice.getCustomer().getAvatarPath() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .orderType(order.getOrderType().name())
                .amount(invoice.getAmount())
                .status(invoice.getStatus().name())
                .createdAt(invoice.getCreatedAt())
                .build();
    }

    private InvoiceDetailResponse toDetailResponse(Invoice invoice) {
        Order order = invoice.getOrder();

        List<InvoiceItemLineResponse> items = orderItemRepository.findByOrderId(order.getId())
                .stream()
                .map(this::toItemLine)
                .toList();

        return InvoiceDetailResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderType(order.getOrderType().name())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .customerId(invoice.getCustomer() != null ? invoice.getCustomer().getId() : null)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : "Walk-in Customer")
                .customerPhone(invoice.getCustomer() != null ? invoice.getCustomer().getPhone() : null)
                .customerEmail(invoice.getCustomer() != null ? invoice.getCustomer().getEmail() : null)
                .customerAvatarPath(invoice.getCustomer() != null ? invoice.getCustomer().getAvatarPath() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .status(invoice.getStatus().name())
                .items(items)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .serviceCharge(order.getServiceCharge())
                .deliveryCharge(order.getDeliveryCharge())
                .tipAmount(order.getTipAmount())
                .grandTotal(order.getGrandTotal())
                .paidAmount(order.getPaidAmount())
                .balanceAmount(order.getBalanceAmount())
                .paymentStatus(order.getPaymentStatus().name())
                .createdAt(invoice.getCreatedAt())
                .build();
    }

    private InvoiceItemLineResponse toItemLine(OrderItem orderItem) {
        return InvoiceItemLineResponse.builder()
                .itemName(orderItem.getItemName())
                .variationName(orderItem.getVariation() != null ? orderItem.getVariation().getSizeName() : null)
                .quantity(orderItem.getQuantity())
                .unitPrice(orderItem.getUnitPrice())
                .lineTotal(orderItem.getLineTotal())
                .build();
    }
}
