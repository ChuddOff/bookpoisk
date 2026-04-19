package com.example.bookvopoisk.controller;

import com.example.bookvopoisk.dto.*;
import com.example.bookvopoisk.service.AuthService;
import com.example.bookvopoisk.service.BankingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/banking")
@RequiredArgsConstructor
@Validated
public class BankingController {

    private final BankingService bankingService;
    private final AuthService authService;

    @PostMapping("/accounts")
    public AccountResponse createAccount(Authentication auth, @Valid @RequestBody CreateAccountRequest request) {
        return bankingService.createAccount(authService.getCurrentUser(auth.getName()), request);
    }

    @GetMapping("/accounts")
    public List<AccountResponse> getAccounts(Authentication auth) {
        return bankingService.getAccounts(authService.getCurrentUser(auth.getName()));
    }

    @PostMapping("/accounts/{accountId}/top-up")
    public AccountResponse topUp(Authentication auth,
                                 @PathVariable Long accountId,
                                 @RequestParam @NotNull @DecimalMin("0.01") BigDecimal amount) {
        return bankingService.topUp(authService.getCurrentUser(auth.getName()), accountId, amount);
    }

    @PostMapping("/transfers")
    public TransactionResponse transfer(Authentication auth, @Valid @RequestBody TransferRequest request) {
        return bankingService.transfer(authService.getCurrentUser(auth.getName()), request);
    }

    @PostMapping("/deposits")
    public DepositResponse openDeposit(Authentication auth, @Valid @RequestBody OpenDepositRequest request) {
        return bankingService.openDeposit(authService.getCurrentUser(auth.getName()), request);
    }

    @GetMapping("/deposits")
    public List<DepositResponse> getDeposits(Authentication auth) {
        return bankingService.getDeposits(authService.getCurrentUser(auth.getName()));
    }

    @GetMapping("/accounts/{accountId}/statement")
    public List<TransactionResponse> statement(Authentication auth, @PathVariable Long accountId) {
        return bankingService.getStatement(authService.getCurrentUser(auth.getName()), accountId);
    }

    @GetMapping("/donation-funds")
    public List<DonationFundResponse> getDonationFunds() {
        return bankingService.getDonationFunds();
    }

    @PostMapping("/donations")
    public TransactionResponse donate(Authentication auth, @Valid @RequestBody DonationRequest request) {
        return bankingService.donate(authService.getCurrentUser(auth.getName()), request);
    }
}
