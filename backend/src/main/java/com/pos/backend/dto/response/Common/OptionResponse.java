package com.pos.backend.dto.response.Common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Generic {id, name} option, used to populate select/dropdown inputs
 * (e.g. Category, Tax) without shipping the full paginated payload.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionResponse {
    private Long id;
    private String name;

}
