package com.pos.backend.repository;

import com.pos.backend.entity.Item;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<Item, Long> {

    boolean existsByCategory_Id(Long categoryId);

    long countByCategory_Id(Long categoryId);

    @Query("""
                SELECT i.category.id, COUNT(i)
                FROM Item i
                WHERE i.category.id IN :categoryIds
                GROUP BY i.category.id
            """)
    List<Object[]> countByCategoryIds(@Param("categoryIds") List<Long> categoryIds);
}
