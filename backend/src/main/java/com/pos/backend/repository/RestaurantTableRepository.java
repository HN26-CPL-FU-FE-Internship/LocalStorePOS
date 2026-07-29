package com.pos.backend.repository;

import com.pos.backend.constant.enums.TableStatus;
import com.pos.backend.entity.RestaurantTable;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    @EntityGraph(attributePaths = { "area" })
    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    @Query("""
                SELECT t FROM RestaurantTable t
                LEFT JOIN FETCH t.area a
                WHERE (:areaId IS NULL OR a.id = :areaId)
                AND (:status IS NULL OR t.status = :status)
                ORDER BY t.tableNumber ASC
            """)
    List<RestaurantTable> search(@Param("areaId") Long areaId, @Param("status") TableStatus status);

    boolean existsByTableNumberIgnoreCase(String tableNumber);

    boolean existsByTableNumberIgnoreCaseAndIdNot(String tableNumber, Long id);
}
