package com.pos.backend.service.Table;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.ReservationRequest;
import com.pos.backend.dto.response.Table.ReservationResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Reservation;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ReservationRepository;
import com.pos.backend.repository.RestaurantTableRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final RestaurantTableRepository restaurantTableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(Long tableId, ReservationStatus status) {
        return reservationRepository.search(tableId, status).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new AppException(ErrorCode.RESTAURANT_TABLE_NOT_FOUND));

        Reservation reservation = Reservation.builder()
                .customer(customer)
                .table(table)
                .reservationTime(request.getReservationTime())
                .guests(request.getGuests())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : ReservationStatus.booked)
                .build();

        // Mark table as booked
        table.setStatus(TableStatus.booked);
        restaurantTableRepository.save(table);

        reservation = reservationRepository.save(reservation);
        return toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse updateReservation(Long id, ReservationRequest request) {
        Reservation reservation = findOrThrow(id);

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        RestaurantTable table = restaurantTableRepository.findById(request.getTableId())
                .orElseThrow(() -> new AppException(ErrorCode.RESTAURANT_TABLE_NOT_FOUND));

        reservation.setCustomer(customer);
        reservation.setTable(table);
        reservation.setReservationTime(request.getReservationTime());
        reservation.setGuests(request.getGuests());
        reservation.setNotes(request.getNotes());

        if (request.getStatus() != null) {
            reservation.setStatus(request.getStatus());
        }

        reservation = reservationRepository.save(reservation);
        return toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = findOrThrow(id);
        reservation.setStatus(status);

        // When cancelled, free up the table
        if (status == ReservationStatus.cancelled) {
            RestaurantTable table = reservation.getTable();
            table.setStatus(TableStatus.available);
            restaurantTableRepository.save(table);
        }

        reservation = reservationRepository.save(reservation);
        return toResponse(reservation);
    }

    @Override
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = findOrThrow(id);
        reservationRepository.delete(reservation);
    }

    private Reservation findOrThrow(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));
    }

    private ReservationResponse toResponse(Reservation r) {
        return ReservationResponse.builder()
                .id(r.getId())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getName())
                .customerPhone(r.getCustomer().getPhone())
                .tableId(r.getTable().getId())
                .tableNumber(r.getTable().getTableNumber())
                .reservationTime(r.getReservationTime())
                .guests(r.getGuests())
                .status(r.getStatus().name())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
