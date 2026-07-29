package com.pos.backend.repository;

import com.pos.backend.entity.NotificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, Long> {
}
