package com.example.bookvopoisk.repository;

import com.example.bookvopoisk.entity.Account;
import com.example.bookvopoisk.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findTop100ByFromAccountOrToAccountOrderByCreatedAtDesc(Account fromAccount, Account toAccount);
}
