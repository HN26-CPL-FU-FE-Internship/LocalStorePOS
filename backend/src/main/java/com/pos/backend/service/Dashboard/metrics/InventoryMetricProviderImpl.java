package com.pos.backend.service.Dashboard.metrics;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.pos.backend.dto.response.Dashboard.CategoryStatResponse;
import com.pos.backend.dto.response.Dashboard.TopSellingItemResponse;
import com.pos.backend.dto.response.Dashboard.TrendingMenuResponse;
import com.pos.backend.repository.OrderItemRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InventoryMetricProviderImpl implements InventoryMetricProvider {

    static final String DEFAULT_CATEGORY_ICON = "utensils";
    static final List<String> CATEGORY_COLORS = List.of("primary", "secondary", "success", "warning", "danger",
            "purple");

    OrderItemRepository orderItemRepository;

    @Override
    public List<TopSellingItemResponse> getTopSellingItems(LocalDateTime fromDate, LocalDateTime toDate, int limit) {
        List<Object[]> rawData = orderItemRepository.findTopSellingItemsBetween(fromDate, toDate,
                PageRequest.of(0, limit));
        int[] rankHolder = { 1 };
        return rawData.stream()
                .map(row -> toTopSellingItemResponse(row, rankHolder[0]++))
                .toList();
    }

    @Override
    public List<CategoryStatResponse> getCategoryStats(LocalDateTime fromDate, LocalDateTime toDate) {
        List<Object[]> rawData = orderItemRepository.findCategoryStatsBetween(fromDate, toDate);
        int[] index = { 0 };
        return rawData.stream()
                .map(row -> toCategoryStatResponse(row, index[0]++))
                .toList();
    }

    @Override
    public List<TrendingMenuResponse> getTrendingMenus(LocalDateTime fromDate, LocalDateTime toDate, int limit) {
        List<Object[]> rawData = orderItemRepository.findTrendingMenusBetween(fromDate, toDate,
                PageRequest.of(0, limit));
        return rawData.stream()
                .map(this::toTrendingMenuResponse)
                .toList();
    }

    private TopSellingItemResponse toTopSellingItemResponse(Object[] row, long rank) {
        return TopSellingItemResponse.builder()
                .rank(rank)
                .name((String) row[1])
                .imageUrl((String) row[2])
                .orders(((Number) row[3]).longValue())
                .build();
    }

    private CategoryStatResponse toCategoryStatResponse(Object[] row, int index) {
        String label = (String) row[0];
        long orders = ((Number) row[1]).longValue();

        return CategoryStatResponse.builder()
                .label(label)
                .icon(DEFAULT_CATEGORY_ICON)
                .color(CATEGORY_COLORS.get(index % CATEGORY_COLORS.size()))
                .orders(orders)
                .build();
    }

    private TrendingMenuResponse toTrendingMenuResponse(Object[] row) {
        Number id = (Number) row[0];
        String name = (String) row[1];
        String imageUrl = (String) row[2];
        com.pos.backend.constant.enums.FoodType foodType = (com.pos.backend.constant.enums.FoodType) row[3];
        Number orders = Optional.ofNullable((Number) row[4]).orElse(0L);

        return TrendingMenuResponse.builder()
                .id(id.longValue())
                .name(name)
                .imageUrl(imageUrl)
                .orders(orders.longValue())
                .dietType(foodType != null ? foodType.name() : "Veg")
                .build();
    }
}
