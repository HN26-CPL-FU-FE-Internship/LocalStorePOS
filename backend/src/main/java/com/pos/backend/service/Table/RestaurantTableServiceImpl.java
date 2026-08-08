package com.pos.backend.service.Table;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.RestaurantTableRequest;
import com.pos.backend.dto.response.Table.RestaurantTableResponse;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.TableArea;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.TableAreaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final TableAreaRepository tableAreaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTableResponse> getTables(Long areaId, TableStatus status) {
        return restaurantTableRepository.search(areaId, status).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public RestaurantTableResponse createTable(RestaurantTableRequest request) {
        validateShapeAndSeats(request.getShape(), request.getSeats());
        TableArea area = findAreaOrThrow(request.getAreaId());

        String tableNumber = request.getTableNumber().trim();
        if (restaurantTableRepository.existsByTableNumberIgnoreCase(tableNumber)) {
            throw new AppException(ErrorCode.TABLE_NUMBER_ALREADY_EXISTS);
        }

        RestaurantTable table = RestaurantTable.builder()
                .area(area)
                .tableNumber(tableNumber)
                .seats(request.getSeats())
                .status(request.getStatus() != null ? request.getStatus() : TableStatus.available)
                .xPosition(request.getXPosition())
                .yPosition(request.getYPosition())
                .shape(normalizeShape(request.getShape()))
                .build();

        table = restaurantTableRepository.save(table);

        return toResponse(table);
    }

    @Override
    @Transactional
    public RestaurantTableResponse updateTable(Long id, RestaurantTableRequest request) {
        RestaurantTable table = findTableOrThrow(id);
        validateShapeAndSeats((request.getShape() != null && !request.getShape().isBlank()) ? request.getShape() : table.getShape(), request.getSeats());
        TableArea area = findAreaOrThrow(request.getAreaId());

        String tableNumber = request.getTableNumber().trim();
        if (restaurantTableRepository.existsByTableNumberIgnoreCaseAndIdNot(tableNumber, id)) {
            throw new AppException(ErrorCode.TABLE_NUMBER_ALREADY_EXISTS);
        }

        table.setArea(area);
        table.setTableNumber(tableNumber);
        table.setSeats(request.getSeats());

        if (request.getStatus() != null) {
            table.setStatus(request.getStatus());
        }
        if (request.getXPosition() != null) {
            table.setXPosition(request.getXPosition());
        }
        if (request.getYPosition() != null) {
            table.setYPosition(request.getYPosition());
        }
        if (request.getShape() != null && !request.getShape().isBlank()) {
            table.setShape(normalizeShape(request.getShape()));
        }

        table = restaurantTableRepository.save(table);

        return toResponse(table);
    }

    @Override
    @Transactional
    public RestaurantTableResponse updateStatus(Long id, TableStatus status) {
        RestaurantTable table = findTableOrThrow(id);
        table.setStatus(status);
        table = restaurantTableRepository.save(table);
        return toResponse(table);
    }

    @Override
    @Transactional
    public void deleteTable(Long id) {
        RestaurantTable table = findTableOrThrow(id);
        restaurantTableRepository.delete(table);
    }

    private RestaurantTable findTableOrThrow(Long id) {
        return restaurantTableRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESTAURANT_TABLE_NOT_FOUND));
    }

    private TableArea findAreaOrThrow(Long areaId) {
        return tableAreaRepository.findById(areaId)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_AREA_NOT_FOUND));
    }

    private String normalizeShape(String shape) {
        if (shape == null || shape.isBlank()) {
            return "ROUND";
        }
        String normalized = shape.trim().toUpperCase();
        return "RECTANGLE".equals(normalized) ? "RECTANGLE" : "ROUND";
    }

    private void validateShapeAndSeats(String shape, Integer seats) {
        String normShape = normalizeShape(shape);
        if (seats == null) {
            return;
        }
        if ("ROUND".equals(normShape)) {
            if (seats != 6 && seats != 8 && seats != 10) {
                throw new AppException(ErrorCode.INVALID_TABLE_CAPACITY);
            }
        } else if ("RECTANGLE".equals(normShape)) {
            if (seats != 4 && seats != 6 && seats != 8) {
                throw new AppException(ErrorCode.INVALID_TABLE_CAPACITY);
            }
        }
    }

    private RestaurantTableResponse toResponse(RestaurantTable table) {
        return RestaurantTableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .areaId(table.getArea() != null ? table.getArea().getId() : null)
                .areaName(table.getArea() != null ? table.getArea().getName() : null)
                .seats(table.getSeats())
                .status(table.getStatus().name())
                .xPosition(table.getXPosition())
                .yPosition(table.getYPosition())
                .shape(table.getShape())
                .createdAt(table.getCreatedAt())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
}
