package com.pos.backend.repository;

import com.pos.backend.entity.DeliverySetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverySettingRepository extends JpaRepository<DeliverySetting, Long> {
}
