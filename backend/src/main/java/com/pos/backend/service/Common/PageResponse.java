package com.pos.backend.service.Common;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PageResponse<T> {

    private List<T> items;

    private int page;

    private int size;

    private long totalElements;

    private int totalPages;

    private boolean first;

    private boolean last;
}
