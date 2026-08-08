package com.pos.backend.repository;

import com.pos.backend.constant.enums.ApprovalRequestType;
import com.pos.backend.constant.enums.ApprovalStatus;
import com.pos.backend.entity.ApprovalRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {

    Page<ApprovalRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT a FROM ApprovalRequest a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:type IS NULL OR a.requestType = :type) " +
           "ORDER BY a.createdAt DESC")
    Page<ApprovalRequest> findByFilters(
            @Param("status") ApprovalStatus status,
            @Param("type") ApprovalRequestType type,
            Pageable pageable);

    long countByStatus(ApprovalStatus status);

    List<ApprovalRequest> findByRequestTypeAndStatus(ApprovalRequestType requestType, ApprovalStatus status);
}
