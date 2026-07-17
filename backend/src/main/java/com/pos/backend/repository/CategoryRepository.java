package com.pos.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("""
                SELECT c FROM Category c
                WHERE (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:status IS NULL OR c.status = :status)
            """)
    Page<Category> search(
        @Param("search") String search,
        @Param("status") CommonStatus status,
        Pageable pageable
    );

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
