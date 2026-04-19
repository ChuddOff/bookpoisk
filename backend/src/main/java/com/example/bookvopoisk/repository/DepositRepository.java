package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.entity.Deposit;
import com.example.bookvopoisk.entity.BankUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepositRepository extends JpaRepository<Deposit, Long> {
    List<Deposit> findAllByUserOrderByCreatedAtDesc(BankUser user);
}
