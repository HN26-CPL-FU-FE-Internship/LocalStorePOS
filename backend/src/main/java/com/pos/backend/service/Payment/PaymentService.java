package com.pos.backend.service.Payment;

import com.pos.backend.constant.enums.PaymentStatus;
import com.pos.backend.dto.response.Payment.PaymentListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface PaymentService {

    PageResponse<PaymentListItemResponse> getPayments(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            PaymentStatus status);
}
