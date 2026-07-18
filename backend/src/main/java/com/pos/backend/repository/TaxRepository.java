package com.pos.backend.repository;

import com.pos.backend.entity.Tax;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxRepository extends JpaRepository<Tax, Long> {
}
