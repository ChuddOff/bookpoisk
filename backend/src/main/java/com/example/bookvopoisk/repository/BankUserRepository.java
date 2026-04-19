package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.entity.BankUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BankUserRepository extends JpaRepository<BankUser, Long> {
    Optional<BankUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
