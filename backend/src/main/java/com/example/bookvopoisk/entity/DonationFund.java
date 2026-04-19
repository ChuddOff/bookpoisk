package com.example.bookvopoisk.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "donation_funds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationFund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal collectedAmount;

    @Column(nullable = false)
    private boolean active;
}
