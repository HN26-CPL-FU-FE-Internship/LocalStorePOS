package com.pos.backend.repository;

import com.pos.backend.entity.PrintSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrintSettingRepository extends JpaRepository<PrintSetting, Long> {
}
