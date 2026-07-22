package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.FoodType;
import com.pos.backend.constant.enums.ItemStatus;
import com.pos.backend.entity.Item;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findAllByOrderByNameAsc();

    List<Item> findByCategory_Id(Long categoryId);

    boolean existsByCategory_Id(Long categoryId);

    long countByCategory_Id(Long categoryId);

    @Query("""
                SELECT i.category.id, COUNT(i)
                FROM Item i
                WHERE i.category.id IN :categoryIds
                GROUP BY i.category.id
            """)
    List<Object[]> countByCategoryIds(@Param("categoryIds") List<Long> categoryIds);

    @Query("""
                SELECT i FROM Item i
                JOIN FETCH i.category c
                LEFT JOIN FETCH i.tax t
                WHERE (:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:categoryId IS NULL OR c.id = :categoryId)
                AND (:foodType IS NULL OR i.foodType = :foodType)
                AND (:status IS NULL OR i.status = :status)
            """)
    Page<Item> search(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("foodType") FoodType foodType,
            @Param("status") ItemStatus status,
            Pageable pageable);
}
