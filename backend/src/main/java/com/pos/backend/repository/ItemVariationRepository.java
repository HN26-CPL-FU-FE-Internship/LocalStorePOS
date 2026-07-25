package com.pos.backend.repository;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pos.backend.entity.ItemVariation;

public interface ItemVariationRepository extends JpaRepository<ItemVariation, Long> {

    List<ItemVariation> findByItem_IdOrderByIdAsc(Long itemId);

    List<ItemVariation> findByItem_IdInOrderByItem_IdAscIdAsc(List<Long> itemIds);

    void deleteByItem_Id(Long itemId);

    @Query("""
            SELECT v
            FROM ItemVariation v
            JOIN FETCH item i
            WHERE v.id IN :ids
            """)
    List<ItemVariation> findAllWithItemByIdIn(Set<Long> ids);
}
