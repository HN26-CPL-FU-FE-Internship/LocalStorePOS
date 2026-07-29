package com.pos.backend.dto.request.TableArea;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TableAreaRequest {

    @NotBlank(message = "Area name must not be blank")
    @Size(max = 100, message = "Area name must not exceed 100 characters")
    private String name;
}
