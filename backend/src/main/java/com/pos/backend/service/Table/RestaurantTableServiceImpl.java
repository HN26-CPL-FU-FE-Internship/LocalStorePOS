package com.pos.backend.service.Table;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.RestaurantTableRequest;
import com.pos.backend.dto.response.Table.RestaurantTableResponse;
import com.pos.backend.entity.Reservation;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.entity.TableArea;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.ReservationRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.repository.TableAreaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final TableAreaRepository tableAreaRepository;
    private final ReservationRepository reservationRepository;

    @Override
    @Transactional
    public List<RestaurantTableResponse> getTables(Long areaId, TableStatus status) {
        autoArriveReservations();
        return restaurantTableRepository.search(areaId, status).stream().map(this::toResponse).toList();
    }

    private void autoArriveReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> overdue = reservationRepository.findOverdueBookings(ReservationStatus.booked, now);
        if (!overdue.isEmpty()) {
            for (Reservation r : overdue) {
                r.setStatus(ReservationStatus.seated);
                RestaurantTable table = r.getTable();
                if (table != null) {
                    table.setStatus(TableStatus.occupied);
                    restaurantTableRepository.save(table);
                }
                reservationRepository.save(r);
            }
        }
    }

    @Override
    @Transactional
    public RestaurantTableResponse createTable(RestaurantTableRequest request) {
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
                .build();

        table = restaurantTableRepository.save(table);

        return toResponse(table);
    }

    @Override
    @Transactional
    public RestaurantTableResponse updateTable(Long id, RestaurantTableRequest request) {
        RestaurantTable table = findTableOrThrow(id);
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

    private RestaurantTableResponse toResponse(RestaurantTable table) {
        return RestaurantTableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .areaId(table.getArea() != null ? table.getArea().getId() : null)
                .areaName(table.getArea() != null ? table.getArea().getName() : null)
                .seats(table.getSeats())
                .status(table.getStatus().name())
                .createdAt(table.getCreatedAt())
                .updatedAt(table.getUpdatedAt())
                .build();
    }
}
