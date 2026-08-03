package com.pos.backend.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;

@Builder
public record EsmsSendSmsRequest(
        @JsonProperty("ApiKey") String apiKey,
        @JsonProperty("SecretKey") String secretKey,
        @JsonProperty("Phone") String phone,
        @JsonProperty("Content") String content,
        @JsonProperty("Brandname") String brandname,
        @JsonProperty("SmsType") String smsType,
        @JsonProperty("IsUnicode") String isUnicode,
        @JsonProperty("Sandbox") String sandbox,
        @JsonProperty("RequestId") String requestId) {
}
