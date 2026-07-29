package com.pos.backend.service.Customer;

import java.util.List;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Customer.CustomerRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Customer.CustomerListItemResponse;
import com.pos.backend.service.Common.PageResponse;

public interface CustomerService {

    PageResponse<CustomerListItemResponse> getCustomers(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CommonStatus status);

    List<OptionResponse> getCustomerOptions();

    CustomerListItemResponse getCustomer(Long id);

    CustomerListItemResponse createCustomer(CustomerRequest request);

    CustomerListItemResponse updateCustomer(Long id, CustomerRequest request);

    void deleteCustomer(Long id);
}
