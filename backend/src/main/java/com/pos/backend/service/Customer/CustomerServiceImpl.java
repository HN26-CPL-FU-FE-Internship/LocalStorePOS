package com.pos.backend.service.Customer;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.dto.request.Customer.CustomerRequest;
import com.pos.backend.dto.response.Common.OptionResponse;
import com.pos.backend.dto.response.Customer.CustomerListItemResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.service.Common.PageResponse;
import com.pos.backend.service.NotificationService;
import com.pos.backend.util.FileStorageUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private static final String IMAGE_SUB_FOLDER = "customers";

    private final CustomerRepository customerRepository;
    private final FileStorageUtil fileStorageUtil;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerListItemResponse> getCustomers(
            int page,
            int size,
            String sortBy,
            String sortDir,
            String search,
            CommonStatus status) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Customer> customerPage = customerRepository.search(normalizedSearch, status, pageable);

        List<CustomerListItemResponse> customers = customerPage.getContent().stream().map(this::toResponse).toList();

        return PageResponse.<CustomerListItemResponse>builder()
                .items(customers)
                .page(page)
                .size(size)
                .totalElements(customerPage.getTotalElements())
                .totalPages(customerPage.getTotalPages())
                .first(customerPage.isFirst())
                .last(customerPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OptionResponse> getCustomerOptions() {
        return customerRepository.findAll(Sort.by("name").ascending())
                .stream()
                .map(c -> OptionResponse.builder()
                        .id(c.getId())
                        .name(c.getName() + " (" + c.getPhone() + ")")
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerListItemResponse getCustomer(Long id) {
        return toResponse(findCustomerOrThrow(id));
    }

    @Override
    @Transactional
    public CustomerListItemResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.CUSTOMER_PHONE_ALREADY_EXISTS);
        }

        String avatarPath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);

        Customer customer = Customer.builder()
                .name(request.getName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail())
                .avatarPath(avatarPath)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.active)
                .isWalkin(request.getIsWalkin() != null ? request.getIsWalkin() : false)
                .build();

        customer = customerRepository.save(customer);

        notificationService.notifyCustomerEvent(
                "New Customer",
                "New customer \"" + customer.getName() + "\" was registered - Phone: " + customer.getPhone(),
                customer.getId());

        return toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerListItemResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = findCustomerOrThrow(id);

        String phone = request.getPhone().trim();
        if (customerRepository.existsByPhoneAndIdNot(phone, id)) {
            throw new AppException(ErrorCode.CUSTOMER_PHONE_ALREADY_EXISTS);
        }

        customer.setName(request.getName().trim());
        customer.setPhone(phone);
        customer.setEmail(request.getEmail());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(request.getGender());

        if (request.getStatus() != null) {
            customer.setStatus(request.getStatus());
        }
        if (request.getIsWalkin() != null) {
            customer.setIsWalkin(request.getIsWalkin());
        }

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            String oldAvatarPath = customer.getAvatarPath();
            String newAvatarPath = fileStorageUtil.storeImage(request.getImage(), IMAGE_SUB_FOLDER);
            customer.setAvatarPath(newAvatarPath);
            fileStorageUtil.deleteFile(oldAvatarPath);
        }

        customer = customerRepository.save(customer);

        return toResponse(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = findCustomerOrThrow(id);
        customerRepository.delete(customer);
        fileStorageUtil.deleteFile(customer.getAvatarPath());
    }

    private Customer findCustomerOrThrow(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
    }

    private CustomerListItemResponse toResponse(Customer customer) {
        return CustomerListItemResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .avatarPath(customer.getAvatarPath())
                .dateOfBirth(customer.getDateOfBirth())
                .gender(customer.getGender() != null ? customer.getGender().name() : null)
                .status(customer.getStatus().name())
                .isWalkin(customer.getIsWalkin())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
