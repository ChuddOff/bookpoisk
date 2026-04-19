package com.example.bookvopoisk.service;

import com.example.bookvopoisk.dto.*;
import com.example.bookvopoisk.entity.*;
import com.example.bookvopoisk.enums.AccountType;
import com.example.bookvopoisk.enums.TransactionType;
import com.example.bookvopoisk.exception.ApiException;
import com.example.bookvopoisk.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BankingService {

    private static final String TRANSFER_2FA_CODE = "000000";

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final DepositRepository depositRepository;
    private final DonationFundRepository donationFundRepository;

    @Transactional
    public AccountResponse createAccount(BankUser user, CreateAccountRequest request) {
        Account account = Account.builder()
                .owner(user)
                .accountNumber(generateAccountNumber())
                .type(request.type())
                .balance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                .active(true)
                .createdAt(OffsetDateTime.now())
                .build();
        return toAccountResponse(accountRepository.save(account));
    }

    public List<AccountResponse> getAccounts(BankUser user) {
        return accountRepository.findAllByOwner(user).stream().map(this::toAccountResponse).toList();
    }

    @Transactional
    public AccountResponse topUp(BankUser user, Long accountId, BigDecimal amount) {
        Account account = requireOwnedAccount(user, accountId);
        account.setBalance(account.getBalance().add(scaleMoney(amount)));
        recordTransaction(null, account, TransactionType.ACCOUNT_TOP_UP, amount, "Manual top-up");
        return toAccountResponse(account);
    }

    @Transactional
    public TransactionResponse transfer(BankUser user, TransferRequest request) {
        if (!TRANSFER_2FA_CODE.equals(request.oneTimeCode())) {
            throw new ApiException("Invalid one-time confirmation code");
        }

        Account from = requireOwnedAccount(user, request.fromAccountId());
        Account to = accountRepository.findByAccountNumber(request.toAccountNumber())
                .orElseThrow(() -> new ApiException("Target account not found"));

        BigDecimal amount = scaleMoney(request.amount());
        ensureSufficientBalance(from, amount);

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        String description = request.description() == null || request.description().isBlank()
                ? "Secure transfer"
                : request.description().trim();

        Transaction txOut = recordTransaction(from, to, TransactionType.TRANSFER_OUT, amount, description);
        recordTransaction(from, to, TransactionType.TRANSFER_IN, amount, description);
        return toTransactionResponse(txOut);
    }

    @Transactional
    public DepositResponse openDeposit(BankUser user, OpenDepositRequest request) {
        Account funding = requireOwnedAccount(user, request.fundingAccountId());
        if (funding.getType() == AccountType.DEPOSIT) {
            throw new ApiException("Deposit account cannot fund a new deposit");
        }

        BigDecimal principal = scaleMoney(request.principal());
        ensureSufficientBalance(funding, principal);

        funding.setBalance(funding.getBalance().subtract(principal));

        BigDecimal projectedPayout = calculateDepositPayout(principal, request.annualRate(), request.durationMonths());
        LocalDate start = LocalDate.now();

        Deposit deposit = Deposit.builder()
                .user(user)
                .fundingAccount(funding)
                .principal(principal)
                .annualRate(request.annualRate().setScale(2, RoundingMode.HALF_UP))
                .durationMonths(request.durationMonths())
                .startDate(start)
                .maturityDate(start.plusMonths(request.durationMonths()))
                .projectedPayout(projectedPayout)
                .createdAt(OffsetDateTime.now())
                .build();

        recordTransaction(funding, null, TransactionType.DEPOSIT_OPEN, principal,
                "Deposit opened for " + request.durationMonths() + " months");

        return toDepositResponse(depositRepository.save(deposit));
    }

    public List<DepositResponse> getDeposits(BankUser user) {
        return depositRepository.findAllByUserOrderByCreatedAtDesc(user).stream().map(this::toDepositResponse).toList();
    }

    @Transactional
    public TransactionResponse donate(BankUser user, DonationRequest request) {
        Account from = requireOwnedAccount(user, request.fromAccountId());
        DonationFund fund = donationFundRepository.findByCode(request.fundCode())
                .orElseThrow(() -> new ApiException("Donation fund not found"));

        if (!fund.isActive()) {
            throw new ApiException("Donation fund is inactive");
        }

        BigDecimal amount = scaleMoney(request.amount());
        ensureSufficientBalance(from, amount);

        from.setBalance(from.getBalance().subtract(amount));
        fund.setCollectedAmount(fund.getCollectedAmount().add(amount));

        Transaction tx = recordTransaction(from, null, TransactionType.DONATION, amount,
                "Donation to fund " + fund.getCode());

        return toTransactionResponse(tx);
    }

    public List<DonationFundResponse> getDonationFunds() {
        return donationFundRepository.findAll().stream()
                .map(f -> new DonationFundResponse(f.getId(), f.getCode(), f.getTitle(), f.getCollectedAmount(), f.isActive()))
                .toList();
    }

    public List<TransactionResponse> getStatement(BankUser user, Long accountId) {
        Account account = requireOwnedAccount(user, accountId);
        return transactionRepository.findTop100ByFromAccountOrToAccountOrderByCreatedAtDesc(account, account)
                .stream().map(this::toTransactionResponse).toList();
    }

    private Account requireOwnedAccount(BankUser user, Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ApiException("Account not found"));

        if (!account.getOwner().getId().equals(user.getId())) {
            throw new ApiException("Access denied for this account");
        }

        if (!account.isActive()) {
            throw new ApiException("Account is inactive");
        }
        return account;
    }

    private BigDecimal scaleMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private void ensureSufficientBalance(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new ApiException("Insufficient funds");
        }
    }

    private BigDecimal calculateDepositPayout(BigDecimal principal, BigDecimal annualRate, Integer months) {
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);

        BigDecimal factor = BigDecimal.ONE.add(monthlyRate).pow(months);
        return principal.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateAccountNumber() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 20);
    }

    private Transaction recordTransaction(Account from, Account to, TransactionType type, BigDecimal amount, String description) {
        Transaction tx = Transaction.builder()
                .fromAccount(from)
                .toAccount(to)
                .type(type)
                .amount(scaleMoney(amount))
                .description(description)
                .createdAt(OffsetDateTime.now())
                .build();
        return transactionRepository.save(tx);
    }

    private AccountResponse toAccountResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getType(),
                account.getBalance(),
                account.isActive(),
                account.getCreatedAt()
        );
    }

    private DepositResponse toDepositResponse(Deposit deposit) {
        return new DepositResponse(
                deposit.getId(),
                deposit.getFundingAccount().getId(),
                deposit.getPrincipal(),
                deposit.getAnnualRate(),
                deposit.getDurationMonths(),
                deposit.getStartDate(),
                deposit.getMaturityDate(),
                deposit.getProjectedPayout()
        );
    }

    private TransactionResponse toTransactionResponse(Transaction tx) {
        return new TransactionResponse(
                tx.getId(),
                tx.getFromAccount() == null ? null : tx.getFromAccount().getId(),
                tx.getToAccount() == null ? null : tx.getToAccount().getId(),
                tx.getType(),
                tx.getAmount(),
                tx.getDescription(),
                tx.getCreatedAt()
        );
    }
}
