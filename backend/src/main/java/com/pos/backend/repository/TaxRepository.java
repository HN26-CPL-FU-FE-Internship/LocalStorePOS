package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.entity.Tax;

public interface TaxRepository extends JpaRepository<Tax, Long> {

    List<Tax> findByStatusOrderByTitleAsc(CommonStatus status);
}
