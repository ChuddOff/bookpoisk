package com.example.bookvopoisk.config;

import com.example.bookvopoisk.entity.DonationFund;
import com.example.bookvopoisk.repository.DonationFundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SeedDataConfig {

    private final DonationFundRepository donationFundRepository;

    @Bean
    CommandLineRunner seedDonationFunds() {
        return args -> {
            if (donationFundRepository.count() > 0) {
                return;
            }

            donationFundRepository.saveAll(List.of(
                    DonationFund.builder().code("CHILD_HEALTH").title("Детское здоровье").collectedAmount(BigDecimal.ZERO).active(true).build(),
                    DonationFund.builder().code("EDU_FUND").title("Образование").collectedAmount(BigDecimal.ZERO).active(true).build(),
                    DonationFund.builder().code("ANIMAL_CARE").title("Помощь животным").collectedAmount(BigDecimal.ZERO).active(true).build()
            ));
        };
    }
}
