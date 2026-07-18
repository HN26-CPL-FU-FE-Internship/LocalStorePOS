package com.pos.backend.repository;

import com.pos.backend.entity.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query("""
                SELECT u
                FROM User u
                JOIN FETCH u.role
                WHERE u.email = :email
            """)
    Optional<User> findByEmailWithRole(String email);
}
