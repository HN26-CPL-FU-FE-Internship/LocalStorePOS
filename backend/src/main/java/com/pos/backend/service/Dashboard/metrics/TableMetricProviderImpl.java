package com.pos.backend.service.Dashboard.metrics;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.response.Dashboard.TableAvailabilityResponse;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.repository.RestaurantTableRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TableMetricProviderImpl implements TableMetricProvider {

    static final String DEFAULT_TABLE_IMAGE = "/src/assets/img/tables/tables-17.svg";

    RestaurantTableRepository restaurantTableRepository;

    @Override
    public List<TableAvailabilityResponse> getAvailableTables(int limit) {
        List<RestaurantTable> tables = restaurantTableRepository.findByStatus(TableStatus.available,
                PageRequest.of(0, limit));
        return tables.stream()
                .map(this::toTableAvailabilityResponse)
                .toList();
    }

    private TableAvailabilityResponse toTableAvailabilityResponse(RestaurantTable table) {
        return TableAvailabilityResponse.builder()
                .id(table.getId())
                .name(table.getTableNumber())
                .guests(table.getSeats())
                .imageUrl(DEFAULT_TABLE_IMAGE)
                .build();
    }
}
