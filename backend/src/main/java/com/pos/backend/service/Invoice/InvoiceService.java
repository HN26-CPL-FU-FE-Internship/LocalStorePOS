package com.pos.backend.service.Invoice;

import com.pos.backend.constant.enums.InvoiceStatus;
import com.pos.backend.dto.response.Invoice.InvoiceDetailResponse;
import com.pos.backend.dto.response.Invoice.InvoiceListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface InvoiceService {

    PageResponse<InvoiceListItemResponse> getInvoices(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            InvoiceStatus status);

    InvoiceDetailResponse getInvoice(Long id);

    void deleteInvoice(Long id);
}
