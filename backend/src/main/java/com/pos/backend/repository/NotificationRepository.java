package com.pos.backend.repository;

import com.pos.backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<Notification> findByUserIsNullAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to);

    long countByUserIsNullAndIsReadFalse();

    List<Notification> findByUserIsNullAndIsReadFalseOrderByCreatedAtDesc();

    /**
     * Remove all notifications referencing a specific target (e.g. the pending
     * "New Approval Request" broadcast once the request is approved/rejected).
     */
    void deleteByTargetTypeAndTargetId(String targetType, Long targetId);

    /* ------------------------------------------------------------------ */
    /*  Combined queries: broadcast (user IS NULL) + user-specific         */
    /*  Used when the caller is authenticated, so they see both kinds.     */
    /* ------------------------------------------------------------------ */

    @Query("SELECT n FROM Notification n WHERE (n.user IS NULL OR n.user.id = :userId) " +
            "AND n.createdAt BETWEEN :from AND :to ORDER BY n.createdAt DESC")
    Page<Notification> findPageForUser(@Param("userId") Long userId,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE (n.user IS NULL OR n.user.id = :userId) " +
            "AND n.createdAt BETWEEN :from AND :to ORDER BY n.createdAt DESC")
    List<Notification> findRecentForUser(@Param("userId") Long userId,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.user IS NULL OR n.user.id = :userId) " +
            "AND n.isRead = false")
    long countUnreadForUser(@Param("userId") Long userId);

    @Query("SELECT n FROM Notification n WHERE (n.user IS NULL OR n.user.id = :userId) " +
            "AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForUser(@Param("userId") Long userId);
}
