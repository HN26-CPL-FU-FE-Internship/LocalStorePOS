package com.pos.backend.repository;

import com.pos.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserIsNullOrderByCreatedAtDesc(Pageable pageable);

    Page<Notification> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long userId, LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<Notification> findByUserIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<Notification> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long userId, LocalDateTime from, LocalDateTime to);

    List<Notification> findByUserIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to);

    long countByUserIdAndIsReadFalse(Long userId);

    long countByUserIsNullAndIsReadFalse();

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIsNullAndIsReadFalseOrderByCreatedAtDesc();
}
