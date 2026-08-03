package com.pos.backend.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EsmsSendSmsResponse(
        @JsonProperty("CodeResult") String codeResult,
        @JsonProperty("SMSID") String smsId,
        @JsonProperty("ErrorMessage") String errorMessage) {
}
