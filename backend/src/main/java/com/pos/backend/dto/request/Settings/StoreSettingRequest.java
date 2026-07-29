package com.pos.backend.dto.request.Settings;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreSettingRequest {

    @NotBlank(message = "Store name must not be blank")
    @Size(max = 150)
    String name;

    MultipartFile image;

    @NotBlank(message = "Address line 1 must not be blank")
    @Size(max = 255)
    String addressLine1;

    @Size(max = 255)
    String addressLine2;

    @Size(max = 100)
    String city;

    @Size(max = 100)
    String state;

    @Size(max = 100)
    String country;

    @Size(max = 20)
    String postalCode;

    @Email
    @Size(max = 150)
    String email;

    @Size(max = 30)
    String phone;

    @NotBlank(message = "Currency must not be blank")
    @Size(max = 10)
    String currencyCode;

    @Size(max = 60)
    String timezone;

    // Feature toggles
    Boolean enableQrMenu;
    Boolean enableTakeaway;
    Boolean enableDineIn;
    Boolean enableReservation;
    Boolean enableOrderViaQr;
    Boolean enableDelivery;
    Boolean enableTable;
}
