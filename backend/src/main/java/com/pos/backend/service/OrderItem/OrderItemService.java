package com.pos.backend.service.OrderItem;

import org.springframework.stereotype.Service;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.request.OrderItem.UpdateOrderItemRequest;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.OrderItemRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemService {

    OrderItemRepository orderItemRepository;

    public OrderItemResponse updateStatus(Long id, UpdateOrderItemRequest request) {

        OrderItem item = orderItemRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_FOUND));

        if (request.getStatus() != null)
            item.setStatus(request.getStatus());

        item = orderItemRepository.save(item);

        return OrderItemResponse.builder()
                .id(item.getId())
                .status(item.getStatus().name())
                .itemName(item.getItemName())
                .quantity(item.getQuantity())
                .build();
    }
}
