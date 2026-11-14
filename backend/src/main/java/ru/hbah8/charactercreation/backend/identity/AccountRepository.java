package ru.hbah8.charactercreation.backend.identity;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Parameterized SQL for accounts and email verification, scoped to identity. */
@Repository
public class AccountRepository {
    private final JdbcClient jdbc;

    public AccountRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    record Account(UUID id, String email, String passwordHash, boolean verified, boolean approved, boolean blocked) {
    }

    Optional<UUID> insert(String email, String passwordHash) {
        return jdbc.sql("""
                INSERT INTO app.accounts (id, email, password_hash, approved) VALUES (:id, :email, :password, false)
                ON CONFLICT (email) DO NOTHING RETURNING id
                """).param("id", UUID.randomUUID()).param("email", email).param("password", passwordHash)
                .query(UUID.class).optional();
    }

    Optional<Account> byEmail(String email) {
        return jdbc.sql("SELECT id, email, password_hash, email_verified, approved, blocked FROM app.accounts WHERE email = :email")
                .param("email", email).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"),
                        rs.getBoolean("approved"), rs.getBoolean("blocked"))).optional();
    }

    Optional<Account> lockByEmail(String email) {
        return jdbc.sql("""
                SELECT id, email, password_hash, email_verified, approved, blocked FROM app.accounts
                WHERE email = :email FOR UPDATE
                """).param("email", email).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"),
                        rs.getBoolean("approved"), rs.getBoolean("blocked"))).optional();
    }

    Optional<UUID> accountForToken(String hash) {
        return jdbc.sql("SELECT account_id FROM app.email_tokens WHERE token_hash = :hash AND purpose = 'verify_email'")
                .param("hash", hash).query(UUID.class).optional();
    }

    /**
     * Locks an existing account until the current transaction ends.
     *
     * @param account account identifier
     */
    public void lock(UUID account) {
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

    Optional<Account> lockById(UUID id) {
        return jdbc.sql("SELECT id, email, password_hash, email_verified, approved, blocked FROM app.accounts WHERE id = :id FOR UPDATE")
                .param("id", id).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"),
                        rs.getBoolean("approved"), rs.getBoolean("blocked"))).optional();
    }

    void insertResetToken(UUID account, String hash, Instant expiry) {
        jdbc.sql("""
                INSERT INTO app.password_reset_tokens (token_hash, account_id, expires_at)
                VALUES (:hash, :id, :expiry)
                """).param("hash", hash).param("id", account)
                .param("expiry", java.sql.Timestamp.from(expiry)).update();
    }

    Optional<UUID> resetTokenAccount(String hash) {
        return jdbc.sql("SELECT account_id FROM app.password_reset_tokens WHERE token_hash = :hash")
                .param("hash", hash).query(UUID.class).optional();
    }

    boolean consumeResetToken(String hash) {
        return jdbc.sql("""
                DELETE FROM app.password_reset_tokens
                WHERE token_hash = :hash AND expires_at > clock_timestamp()
                """).param("hash", hash).update() == 1;
    }

    void updatePasswordAndRevoke(UUID account, String passwordHash) {
        jdbc.sql("UPDATE app.accounts SET password_hash = :password WHERE id = :id")
                .param("password", passwordHash).param("id", account).update();
        jdbc.sql("DELETE FROM app.password_reset_tokens WHERE account_id = :id").param("id", account).update();
        jdbc.sql("DELETE FROM app.spring_session WHERE principal_name = :id")
                .param("id", account.toString()).update();
    }

    AccountView view(UUID id) {
        return jdbc.sql("SELECT id, email, approved FROM app.accounts WHERE id = :id")
                .param("id", id).query(AccountView.class).single();
    }

    /** Public account representation, with no credential material. */
    public record AccountView(UUID id, String email, boolean approved) {
    }

    Optional<Account> byId(UUID id) {
        return jdbc.sql("SELECT id, email, password_hash, email_verified, approved, blocked FROM app.accounts WHERE id = :id")
                .param("id", id).query((rs, row) -> new Account(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getString("password_hash"), rs.getBoolean("email_verified"),
                        rs.getBoolean("approved"), rs.getBoolean("blocked"))).optional();
    }

    public void revokeSessions(UUID account) {
        jdbc.sql("DELETE FROM app.spring_session WHERE principal_name = :id")
                .param("id", account.toString()).update();
    }

    int deleteExpiredPendingAccounts(Instant cutoff, List<UUID> administratorIds) {
        String sql = """
                DELETE FROM app.accounts
                WHERE created_at < :cutoff AND (email_verified = false OR approved = false)
                """;
        if (!administratorIds.isEmpty()) {
            sql += " AND id NOT IN (:administratorIds)";
        }
        var deletion = jdbc.sql(sql).param("cutoff", java.sql.Timestamp.from(cutoff));
        if (!administratorIds.isEmpty()) {
            deletion.param("administratorIds", administratorIds);
        }
        return deletion.update();
    }
}
