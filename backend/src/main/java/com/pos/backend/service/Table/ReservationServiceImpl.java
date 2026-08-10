package com.pos.backend.service.Table;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.OrderStatus;
import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.dto.request.Table.ReservationRequest;
import com.pos.backend.dto.response.Table.ReservationResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Reservation;
import com.pos.backend.entity.RestaurantTable;
import com.pos.backend.exception.AppException;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.OrderRepository;
import com.pos.backend.repository.ReservationRepository;
import com.pos.backend.repository.RestaurantTableRepository;
import com.pos.backend.service.Notification.EsmsSmsService;
import com.pos.backend.service.NotificationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final EsmsSmsService esmsSmsService;

    /**
     * Real-world slot model for a reservation: the table is blocked from
     * {@code PREP_BUFFER_MINUTES} before the booking (preparation/cleanup)
     * until the expected dining window PLUS an overrun buffer, because guests
     * regularly stay longer than planned.
     */
    private static final int PREP_BUFFER_MINUTES = 60;
    private static final int DINING_WINDOW_MINUTES = 120;
    private static final int OVERRUN_BUFFER_MINUTES = 60;

    /** Reservations that still hold the table (booked or seated). */
    private static final List<ReservationStatus> ACTIVE_STATUSES =
            List.of(ReservationStatus.booked, ReservationStatus.seated);

    /** Order statuses that no longer hold the table (finished or voided). */
    private static final List<OrderStatus> RESOLVED_ORDER_STATUSES =
            List.of(OrderStatus.completed, OrderStatus.cancelled);

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservations(Long tableId, ReservationStatus status) {
        return reservationRepository.search(tableId, status).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request) {
        Customer customer = findCustomerOrThrow(request.getCustomerId());
        RestaurantTable table = findTableOrThrow(request.getTableId());

        validateFutureTime(request.getReservationTime());
        ensureNoConflict(table.getId(), request.getReservationTime(), null);

        Reservation reservation = Reservation.builder()
                .customer(customer)
                .table(table)
                .reservationTime(request.getReservationTime())
                .guests(request.getGuests())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : ReservationStatus.booked)
                .build();

        // Mirror the reservation state onto the table (booked for a booking,
        // occupied when created as seated).
        syncTableToReservation(table, reservation.getStatus(), null);

        reservation = reservationRepository.save(reservation);

        notifyReservation("New Reservation", "booked table", reservation, customer, table);
        try {
            esmsSmsService.sendReservationConfirmation(
                    reservation,
                    customer,
                    table);
        } catch (Exception e) {
            System.out.println("Send SMS failed");
        }

        return toResponse(reservation);
    }

    @Override
    @Transactional
    public ReservationResponse updateReservation(Long id, ReservationRequest request) {
        Reservation reservation = findOrThrow(id);

        Customer customer = findCustomerOrThrow(request.getCustomerId());
        RestaurantTable table = findTableOrThrow(request.getTableId());

        ReservationStatus newStatus = request.getStatus() != null ? request.getStatus() : reservation.getStatus();
        boolean resolving = isResolvingStatus(newStatus);
        // Resolving a reservation (completed/cancelled/paid) is legitimate even
        // when the booked time has already passed — only active bookings are
        // validated for future time and slot conflicts.
        if (!resolving) {
            validateFutureTime(request.getReservationTime());
            ensureNoConflict(table.getId(), request.getReservationTime(), id);
        }

        RestaurantTable previousTable = reservation.getTable();

        reservation.setCustomer(customer);
        reservation.setTable(table);
        reservation.setReservationTime(request.getReservationTime());
        reservation.setGuests(request.getGuests());
        reservation.setNotes(request.getNotes());

        if (request.getStatus() != null) {
            reservation.setStatus(request.getStatus());
        }

        reservation = reservationRepository.save(reservation);

        // Moving a reservation to another table must release the old table
        // (only when it is no longer held by anything else) and mirror the
        // reservation state on the new table.
        if (!previousTable.getId().equals(table.getId())) {
            freeTableIfNotInUse(previousTable, id);
        }
        syncTableToReservation(table, reservation.getStatus(), id);

        notifyReservation("Reservation Updated", "updated reservation for table", reservation, customer, table);

        return toResponse(reservation);
    }

    private void validateFutureTime(LocalDateTime time) {
        if (time == null || time.isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.RESERVATION_TIME_IN_PAST);
        }
    }

    /**
     * Reject a booking that overlaps another active reservation on the same
     * table. The slot window already includes the prep buffer before and the
     * dining + overrun buffer after the reservation time.
     */
    private void ensureNoConflict(Long tableId, LocalDateTime time, Long excludeReservationId) {
        LocalDateTime newStart = slotStart(time);
        LocalDateTime newEnd = slotEnd(time);
        for (Reservation existing : reservationRepository.findByTableIdAndStatusIn(tableId, ACTIVE_STATUSES)) {
            if (excludeReservationId != null && existing.getId().equals(excludeReservationId)) {
                continue;
            }
            LocalDateTime existingStart = slotStart(existing.getReservationTime());
            LocalDateTime existingEnd = slotEnd(existing.getReservationTime());
            if (newStart.isBefore(existingEnd) && existingStart.isBefore(newEnd)) {
                throw new AppException(ErrorCode.TABLE_ALREADY_RESERVED);
            }
        }
    }

    private LocalDateTime slotStart(LocalDateTime time) {
        return time.minusMinutes(PREP_BUFFER_MINUTES);
    }

    private LocalDateTime slotEnd(LocalDateTime time) {
        return time.plusMinutes(DINING_WINDOW_MINUTES + OVERRUN_BUFFER_MINUTES);
    }

    /**
     * Mirror the reservation state onto its table. Resolved reservations
     * (cancelled/completed/paid) release the table only when no other active
     * reservation remains on it.
     */
    private void syncTableToReservation(RestaurantTable table, ReservationStatus status, Long reservationId) {
        switch (status) {
            case booked -> setTableStatusIfNeeded(table, TableStatus.booked);
            case seated -> setTableStatusIfNeeded(table, TableStatus.occupied);
            case completed, cancelled, paid -> freeTableIfNotInUse(table, reservationId);
        }
    }

    private boolean isResolvingStatus(ReservationStatus status) {
        return status == ReservationStatus.cancelled
                || status == ReservationStatus.completed
                || status == ReservationStatus.paid;
    }

    private void setTableStatusIfNeeded(RestaurantTable table, TableStatus target) {
        if (table.getStatus() != target) {
            table.setStatus(target);
            restaurantTableRepository.save(table);
        }
    }

    /**
     * Release the table only when it is no longer held by anything: no other
     * active reservation AND no in-progress order (the table state is shared
     * with the POS/order flow, so an occupied table must stay occupied while
     * guests are dining).
     */
    private void freeTableIfNotInUse(RestaurantTable table, Long excludeReservationId) {
        boolean hasOtherActiveReservation = reservationRepository.findByTableIdAndStatusIn(
                table.getId(), ACTIVE_STATUSES)
                .stream()
                .anyMatch(r -> excludeReservationId == null || !r.getId().equals(excludeReservationId));
        boolean hasActiveOrder = orderRepository.countByTableIdAndStatusNotIn(
                table.getId(), RESOLVED_ORDER_STATUSES) > 0;
        if (!hasOtherActiveReservation && !hasActiveOrder && table.getStatus() != TableStatus.available) {
            table.setStatus(TableStatus.available);
            restaurantTableRepository.save(table);
        }
    }

    private Customer findCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
    }

    private RestaurantTable findTableOrThrow(Long tableId) {
        return restaurantTableRepository.findById(tableId)
                .orElseThrow(() -> new AppException(ErrorCode.RESTAURANT_TABLE_NOT_FOUND));
    }

    private void notifyReservation(String title, String action, Reservation reservation,
            Customer customer, RestaurantTable table) {
        notificationService.notifyReservationEvent(
                title,
                customer.getName() + " " + action + " " + table.getTableNumber()
                        + " - " + reservation.getGuests() + " guests"
                        + " at " + reservation.getReservationTime(),
                reservation.getId());
    }

    @Override
    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = findOrThrow(id);
        reservation.setStatus(status);
        reservation = reservationRepository.save(reservation);

        // Keep the table state in sync with the reservation lifecycle:
        // booked -> table booked, seated -> table occupied, and a resolved
        // reservation (cancelled/completed/paid) releases the table only when
        // no other active reservation remains on it.
        syncTableToReservation(reservation.getTable(), status, id);

        String statusLabel = switch (status) {
            case booked -> "booked";
            case seated -> "seated";
            case cancelled -> "cancelled";
            case completed -> "completed";
            case paid -> "paid";
        };

        notificationService.notifyReservationEvent(
                "Reservation Status Changed",
                "Reservation #" + reservation.getId() + " - Table " + reservation.getTable().getTableNumber()
                        + " changed to status " + statusLabel,
                reservation.getId());

        return toResponse(reservation);
    }

    @Override
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = findOrThrow(id);
        RestaurantTable table = reservation.getTable();
        reservationRepository.delete(reservation);

        // Deleting an active reservation must not leave the table stuck as
        // booked/occupied.
        freeTableIfNotInUse(table, id);
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
