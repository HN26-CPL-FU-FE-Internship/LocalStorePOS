package com.pos.backend.repository;

import com.pos.backend.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IntegrationRepository extends JpaRepository<Integration, Long> {
}
