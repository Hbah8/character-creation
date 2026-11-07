package ru.hbah8.charactercreation.backend.identity;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Parameterized SQL for accounts and email verification, scoped to identity. */
@Repository
public class AccountRepository {
    private final JdbcClient jdbc;

    public AccountRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    record Account(UUID id, String email, String passwordHash, boolean verified) {
    }

    Optional<UUID> insert(String email, String passwordHash) {
        return jdbc.sql("""
                INSERT INTO app.accounts (id, email, password_hash) VALUES (:id, :email, :password)
                ON CONFLICT (email) DO NOTHING RETURNING id
                """).param("id", UUID.randomUUID()).param("email", email).param("password", passwordHash)
                .query(UUID.class).optional();
    }

    Optional<Account> byEmail(String email) {
        return jdbc.sql("SELECT id, email, password_hash, email_verified FROM app.accounts WHERE email = :email")
                .param("email", email).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"))).optional();
    }

    Optional<Account> lockByEmail(String email) {
        return jdbc.sql("""
                SELECT id, email, password_hash, email_verified FROM app.accounts
                WHERE email = :email FOR UPDATE
                """).param("email", email).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"))).optional();
    }

    Optional<UUID> accountForToken(String hash) {
        return jdbc.sql("SELECT account_id FROM app.email_tokens WHERE token_hash = :hash AND purpose = 'verify_email'")
                .param("hash", hash).query(UUID.class).optional();
    }

    void lock(UUID account) {
        jdbc.sql("SELECT id FROM app.accounts WHERE id = :id FOR UPDATE").param("id", account).query(UUID.class).single();
    }

    void replaceToken(UUID account, String hash, Instant expiry) {
        jdbc.sql("DELETE FROM app.email_tokens WHERE account_id = :id AND used_at IS NULL")
                .param("id", account).update();
        jdbc.sql("""
                INSERT INTO app.email_tokens (token_hash, account_id, purpose, expires_at)
                VALUES (:hash, :id, 'verify_email', :expiry)
                """).param("hash", hash).param("id", account).param("expiry", java.sql.Timestamp.from(expiry)).update();
    }

    boolean consumeToken(String hash) {
        return jdbc.sql("""
                UPDATE app.email_tokens SET used_at = CURRENT_TIMESTAMP
                WHERE token_hash = :hash AND purpose = 'verify_email'
                  AND used_at IS NULL AND expires_at > clock_timestamp()
                """).param("hash", hash).update() == 1;
    }

    void verify(UUID account) {
        jdbc.sql("UPDATE app.accounts SET email_verified = true WHERE id = :id").param("id", account).update();
    }

    AccountView view(UUID id) {
        return jdbc.sql("SELECT id, email FROM app.accounts WHERE id = :id")
                .param("id", id).query(AccountView.class).single();
    }

    /** Public account representation, with no credential material. */
    public record AccountView(UUID id, String email) {
    }
}
