package com.pos.backend.controller.Invoice;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.InvoiceStatus;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Invoice.InvoiceDetailResponse;
import com.pos.backend.dto.response.Invoice.InvoiceListItemResponse;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.Invoice.InvoiceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<PageResponse<InvoiceListItemResponse>> getInvoices(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InvoiceStatus status) {

        PageResponse<InvoiceListItemResponse> response = invoiceService.getInvoices(
                page, size, sortBy, sortDir, search, status);

        return ApiResponse.<PageResponse<InvoiceListItemResponse>>builder()
                .message("Success")
                .result(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceDetailResponse> getInvoice(@PathVariable Long id) {
        return ApiResponse.<InvoiceDetailResponse>builder()
                .message("Success")
                .result(invoiceService.getInvoice(id))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);

        return ApiResponse.<Void>builder()
                .message("Invoice deleted successfully")
                .build();
    }
}
