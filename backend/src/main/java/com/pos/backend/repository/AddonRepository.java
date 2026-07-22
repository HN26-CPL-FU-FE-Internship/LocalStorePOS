package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pos.backend.constant.enums.CommonStatus;
import com.pos.backend.entity.Addon;

public interface AddonRepository extends JpaRepository<Addon, Long> {

    List<Addon> findByItem_IdOrderByIdAsc(Long itemId);

    List<Addon> findByItem_IdInOrderByItem_IdAscIdAsc(List<Long> itemIds);

    void deleteByItem_Id(Long itemId);

    @Query("""
                SELECT a FROM Addon a
                JOIN FETCH a.item i
                WHERE (:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:itemId IS NULL OR i.id = :itemId)
                AND (:status IS NULL OR a.status = :status)
            """)
    Page<Addon> search(
            @Param("search") String search,
            @Param("itemId") Long itemId,
            @Param("status") CommonStatus status,
            Pageable pageable);
}
