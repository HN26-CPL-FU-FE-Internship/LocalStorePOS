package com.pos.backend.controller.Table;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.pos.backend.constant.enums.ReservationStatus;
import com.pos.backend.dto.request.Table.ReservationRequest;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.dto.response.Table.ReservationResponse;
import com.pos.backend.service.Table.ReservationService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReservationController {

    ReservationService reservationService;

    @GetMapping
    public ApiResponse<List<ReservationResponse>> getReservations(
            @RequestParam(required = false) Long tableId,
            @RequestParam(required = false) ReservationStatus status) {

        return ApiResponse.<List<ReservationResponse>>builder()
                .message("Success")
                .result(reservationService.getReservations(tableId, status))
                .build();
    }

    @PostMapping
    public ApiResponse<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request) {

        return ApiResponse.<ReservationResponse>builder()
                .message("Reservation created successfully")
                .result(reservationService.createReservation(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ReservationResponse> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request) {

        return ApiResponse.<ReservationResponse>builder()
                .message("Reservation updated successfully")
                .result(reservationService.updateReservation(id, request))
                .build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ReservationResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam ReservationStatus status) {

        return ApiResponse.<ReservationResponse>builder()
                .message("Reservation status updated successfully")
                .result(reservationService.updateStatus(id, status))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ApiResponse.<Void>builder()
                .message("Reservation deleted successfully")
                .build();
    }
}
