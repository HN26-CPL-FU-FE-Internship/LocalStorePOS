package com.pos.backend.dto.response.Administration;

import com.fasterxml.jackson.annotation.JsonProperty;

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
public class PermissionModuleResponse {

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
