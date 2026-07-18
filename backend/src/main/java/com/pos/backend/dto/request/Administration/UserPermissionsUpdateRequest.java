package com.pos.backend.dto.request.Administration;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserPermissionsUpdateRequest {

    @Valid
    List<ModuleEntry> permissions;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ModuleEntry {
        @NotBlank
        String module;

        boolean view;
        boolean add;
        boolean edit;

        @JsonProperty("delete_")
        boolean delete;

        @JsonProperty("export_")
        boolean export;

        boolean approvedVoid;
    }
}
