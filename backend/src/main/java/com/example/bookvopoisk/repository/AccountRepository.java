package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.entity.Account;
import com.example.bookvopoisk.entity.BankUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findAllByOwner(BankUser owner);
    Optional<Account> findByAccountNumber(String accountNumber);
}
