package com.pos.backend.service.Order;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderItemAddon;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderCommonService {

    public Map<Long, List<OrderItemAddonResponse>> groupAddonsByItemId(List<OrderItemAddon> addons) {
        return addons.stream()
                .collect(
                        Collectors
                                .groupingBy(addon -> addon.getOrderItem().getId(),
                                        Collectors.mapping(
                                                addon -> new OrderItemAddonResponse(
                                                        addon.getId(),
                                                        addon.getAddon() != null
                                                                ? addon.getAddon()
                                                                        .getId()
                                                                : null,
                                                        addon.getAddonName(),
                                                        addon.getAddonPrice(),
                                                        addon.getQuantity()),
                                                Collectors.toList())));
    }

    public Map<Long, List<OrderItemResponse>> groupItemsByOrderId(List<OrderItem> orderItems,
            Map<Long, List<OrderItemAddonResponse>> addonsByOrderItemId) {
        return orderItems.stream()
                .collect(
                        Collectors
                                .groupingBy(item -> item.getOrder().getId(),
                                        Collectors.mapping(
                                                item -> new OrderItemResponse(
                                                        item.getId(),
                                                        item.getItem() != null
                                                                ? item.getItem().getId()
                                                                : null,
                                                        item.getItemName(),
                                                        item.getQuantity(),
                                                        item.getKitchenNote(),
                                                        item.getVariation() != null
                                                                ? item.getVariation()
                                                                        .getSizeName()
                                                                : null,
                                                        item.getUnitPrice(),
                                                        addonsByOrderItemId
                                                                .getOrDefault(item
                                                                        .getId(),
                                                                        List.of()),
                                                        item.getVariation() != null
                                                                ? item.getVariation()
                                                                        .getId()
                                                                : null),
                                                Collectors.toList())));
    }
}
