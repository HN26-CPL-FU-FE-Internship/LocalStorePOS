package com.pos.backend.dto.request.TableFloor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TableFloorRequest {

    @NotBlank(message = "Floor name must not be blank")
    @Size(max = 100, message = "Floor name must not exceed 100 characters")
    private String name;
}
