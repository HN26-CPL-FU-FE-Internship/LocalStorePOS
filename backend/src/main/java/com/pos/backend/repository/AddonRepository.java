package com.pos.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pos.backend.entity.Addon;

public interface AddonRepository extends JpaRepository<Addon, Long> {

    List<Addon> findByItem_IdOrderByIdAsc(Long itemId);

    void deleteByItem_Id(Long itemId);
}
