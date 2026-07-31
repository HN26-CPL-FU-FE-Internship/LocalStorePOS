package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.entity.TableArea;

public interface TableAreaRepository extends JpaRepository<TableArea, Long> {

    List<TableArea> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
