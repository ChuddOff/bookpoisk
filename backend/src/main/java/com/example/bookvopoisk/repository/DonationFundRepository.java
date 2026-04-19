package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.entity.DonationFund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DonationFundRepository extends JpaRepository<DonationFund, Long> {
    Optional<DonationFund> findByCode(String code);
}
