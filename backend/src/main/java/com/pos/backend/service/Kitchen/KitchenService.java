package com.pos.backend.service.Kitchen;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.KitchenStatus;
import com.pos.backend.dto.response.Order.OrderResponse;
import com.pos.backend.dto.response.OrderItem.OrderItemResponse;
import com.pos.backend.dto.response.OrderItemAddons.OrderItemAddonResponse;
import com.pos.backend.entity.Order;
import com.pos.backend.entity.OrderItem;
import com.pos.backend.entity.OrderItemAddon;
import com.pos.backend.repository.OrderItemAddonRepository;
import com.pos.backend.repository.OrderItemRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.service.Order.OrderCommonService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class KitchenService {

	OrderRepository orderRepository;
	OrderItemRepository orderItemRepository;
	OrderItemAddonRepository orderItemAddonRepository;
	OrderCommonService orderCommonService;

	public Map<String, Long> getKitchenStats() {

		Map<String, Long> result = new LinkedHashMap<>();
		for (KitchenStatus status : KitchenStatus.values()) {
			result.put(status.name(), 0L);
		}

		List<KitchenStatusCount> stats = orderRepository.countOrderByKitchenStatus();

		for (KitchenStatusCount statusCount : stats) {
			result.put(statusCount.getKitchenStatus(), statusCount.getTotalOrder());
		}

		return result;
	}

	public List<OrderResponse> getKitchenOrders(Pageable pageable) {

		Page<Order> orders = orderRepository.findAll(pageable);
		List<Long> orderIds = orders.stream().map(order -> order.getId()).toList();

		List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds);
		List<Long> orderItemIds = orderItems.stream().map(item -> item.getId()).toList();

		List<OrderItemAddon> addons = orderItemAddonRepository.findByOrderItemIdIn(orderItemIds);

		Map<Long, List<OrderItemAddonResponse>> addonsByOrderItemId = orderCommonService.groupAddonsByItemId(addons);

		Map<Long, List<OrderItemResponse>> orderItemsByOrderId = orderCommonService.groupItemsByOrderId(orderItems,
				addonsByOrderItemId);

		return orders.stream().map(order -> OrderResponse.builder()
				.id(order.getId())
				.kitchenStatus(order.getKitchenStatus().toString())
				.tokenNo(order.getTokenNo())
				.items(orderItemsByOrderId.getOrDefault(order.getId(), List.of()))
				.estimatedMinutes(order.getEstimatedMinutes())
				.cookingStartedAt(order.getCookingStartedAt())
				.orderNumber(order.getOrderNumber())
				.orderedAt(order.getOrderedAt())
				.orderType(order.getOrderType().toString())
				.customerName(order.getCustomer() != null ? order.getCustomer().getName()
						: "Walk In Customer")
				.build()).toList();
	}
}
