package com.pos.backend.service.Notification;

import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.pos.backend.dto.external.EsmsSendSmsRequest;
import com.pos.backend.dto.external.EsmsSendSmsResponse;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Reservation;
import com.pos.backend.entity.RestaurantTable;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EsmsSmsService {

    private static final String ESMS_SEND_URL =
            "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";
    private static final String SUCCESS_CODE = "100";
    private static final DateTimeFormatter RESERVATION_TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Pattern NON_DIGIT = Pattern.compile("\\D");

    private final RestClient restClient;
    private final String apiKey;
    private final String secretKey;
    private final String brandname;
    private final boolean enabled;
    private final boolean sandbox;

    public EsmsSmsService(
            @Value("${esms.api-key:}") String apiKey,
            @Value("${esms.secret-key:}") String secretKey,
            @Value("${esms.brandname:}") String brandname,
            @Value("${esms.enabled:false}") boolean enabled,
            @Value("${esms.sandbox:false}") boolean sandbox) {
        this.restClient = RestClient.create();
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.brandname = brandname;
        this.enabled = enabled;
        this.sandbox = sandbox;
    }

    public void sendReservationConfirmation(Reservation reservation, Customer customer, RestaurantTable table) {
        if (!enabled) {
            return;
        }

        if (apiKey.isBlank() || secretKey.isBlank()) {
            log.warn("eSMS is enabled but api-key or secret-key is missing");
            return;
        }

        String phone = normalizePhone(customer.getPhone());
        if (phone == null) {
            log.warn("Cannot send reservation SMS: invalid phone for customer {}", customer.getId());
            return;
        }

        String content = buildReservationMessage(customer, table, reservation);
        String requestId = "reservation-" + reservation.getId();

        try {
            EsmsSendSmsRequest request = EsmsSendSmsRequest.builder()
                    .apiKey(apiKey)
                    .secretKey(secretKey)
                    .phone(phone)
                    .content(content)
                    .smsType("2")
                    .isUnicode("1")
                    .sandbox(sandbox ? "1" : "0")
                    .requestId(requestId)
                    .build();

            EsmsSendSmsResponse response = restClient.post()
                    .uri(ESMS_SEND_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(EsmsSendSmsResponse.class);

            if (response == null) {
                log.error("eSMS returned empty response for reservation {}", reservation.getId());
                return;
            }

            if (!SUCCESS_CODE.equals(response.codeResult())) {
                log.error(
                        "eSMS failed for reservation {}: code={}, message={}",
                        reservation.getId(),
                        response.codeResult(),
                        response.errorMessage());
                return;
            }

            log.info("Reservation confirmation SMS sent for reservation {}", reservation.getId());
        } catch (RestClientException ex) {
            log.error("Failed to call eSMS API for reservation {}", reservation.getId(), ex);
        }
    }

    private String buildReservationMessage(Customer customer, RestaurantTable table, Reservation reservation) {
        if ("Baotrixemay".equalsIgnoreCase(brandname)) {
            return "Cam on quy khach da su dung dich vu cua chung toi. Chuc quy khach mot ngay tot lanh!";
        }

        return String.format(
                "Xin chao %s, ban da dat ban thanh cong tai nha hang. Ban %s, %d khach, luc %s. Cam on quy khach!",
                customer.getName(),
                table.getTableNumber(),
                reservation.getGuests(),
                reservation.getReservationTime().format(RESERVATION_TIME_FORMAT));
    }

    private String normalizePhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            return null;
        }

        String digits = NON_DIGIT.matcher(rawPhone.trim()).replaceAll("");
        if (digits.startsWith("84") && digits.length() >= 11) {
            digits = "0" + digits.substring(2);
        }

        if (!digits.matches("0\\d{9,10}")) {
            return null;
        }

        return digits;
    }
}
