package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.models.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<Users, UUID> {
   Optional<Users> findByUsername(String username);
}
