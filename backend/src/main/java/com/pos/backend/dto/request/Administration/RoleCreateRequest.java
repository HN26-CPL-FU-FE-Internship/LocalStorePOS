package com.pos.backend.dto.request.Administration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class RoleCreateRequest {

    @NotBlank(message = "Role name is required")
    @Size(max = 50, message = "Role name must be at most 50 characters")
    String name;
}
