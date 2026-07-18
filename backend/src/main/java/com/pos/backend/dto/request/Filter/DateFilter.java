package com.pos.backend.dto.request.Filter;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DateFilter {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    LocalDate toDate;
}
