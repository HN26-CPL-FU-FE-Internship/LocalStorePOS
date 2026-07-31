package com.pos.backend.service.Table;

import java.util.List;

import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.dto.request.Table.ReservationRequest;
import com.pos.backend.dto.response.Table.ReservationResponse;

public interface ReservationService {

    List<ReservationResponse> getReservations(Long tableId, ReservationStatus status);

    ReservationResponse createReservation(ReservationRequest request);

    ReservationResponse updateReservation(Long id, ReservationRequest request);

    ReservationResponse updateStatus(Long id, ReservationStatus status);

    void deleteReservation(Long id);
}
