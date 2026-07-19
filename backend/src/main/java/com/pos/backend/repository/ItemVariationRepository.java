package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.entity.ItemVariation;

public interface ItemVariationRepository extends JpaRepository<ItemVariation, Long> {

    List<ItemVariation> findByItem_IdOrderByIdAsc(Long itemId);

    void deleteByItem_Id(Long itemId);
}
