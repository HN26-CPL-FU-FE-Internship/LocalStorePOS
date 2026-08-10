package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.entity.TableFloor;

public interface TableFloorRepository extends JpaRepository<TableFloor, Long> {

    List<TableFloor> findAllByOrderByIdAsc();

    boolean existsByNameIgnoreCase(String name);
}
