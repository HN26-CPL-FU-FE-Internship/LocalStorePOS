package com.pos.backend.repository;

import com.pos.backend.entity.RestaurantTable;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    @EntityGraph(attributePaths = { "area" })
    Optional<RestaurantTable> findByTableNumber(String tableNumber);
}
