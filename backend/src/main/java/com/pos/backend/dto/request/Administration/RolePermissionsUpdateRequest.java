package com.pos.backend.dto.request.Administration;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RolePermissionsUpdateRequest {

    @Valid
    @NotNull(message = "Permissions list is required")
    List<PermissionModuleEntry> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PermissionModuleEntry {

        @NotNull(message = "Module name is required")
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
