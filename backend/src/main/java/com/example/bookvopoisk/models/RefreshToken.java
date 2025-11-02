package com.example.bookvopoisk.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens",
  indexes = {
  @Index(name = "idx_rt_user", columnList = "user_id"), // idx_rt_user по user_id — ускорит все запросы вида: «найти все рефреши пользователя», «отозвать все рефреши пользователя»
    @Index(name = "idx_rt_expires", columnList = "expires_at") // ускорит регулярную чистку: «удалить/выбрать все истёкшие»
  }, uniqueConstraints = @UniqueConstraint(name = "uk_rt_token_hash", columnNames = "token_hash") // быстрый поиск по хэшу + гарантия уникальности, что двух одинаковых хэшей токена в таблице быть не может
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id") // аннотация Lombok, которая генерирует equals() и hashCode() только по полю id
public class RefreshToken {
  @Id
  @GeneratedValue
  @Column(name = "id", nullable = false)
  private UUID id;
  // @ManyToOne говорит “есть ссылка на другую сущность”, а @JoinColumn говорит “в какой именно колонке/с какими правилами хранить FK”
  // Без @JoinColumn Hibernate придумает имя колонки и настройки сам — обычно user_id на PK таблицы users
  @ManyToOne(optional = false, fetch = FetchType.LAZY) // ManyToOne — связь через user_id, optional=false — без пользователя сохранить нельзя, fetch=LAZY — пользователя не грузим, пока не попросили
  @JoinColumn(name = "user_id", nullable = false)
  private Users user;

  @Column(name = "token_hash", nullable = false)
  private String refreshTokenHash;

  @Column(name = "issued_at", nullable = false)
  private Instant issuedAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked", nullable = false)
  private boolean revoked = false; // Флаг «этот refresh-токен больше нельзя использовать»

  @PrePersist
  void prePersist() {
    if (issuedAt == null) issuedAt = Instant.now(); // чтобы время создание в service не прописывать
  }
}
