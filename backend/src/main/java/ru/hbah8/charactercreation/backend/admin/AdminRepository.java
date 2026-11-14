package ru.hbah8.charactercreation.backend.admin;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Parameterized storage operations for the administrator-only account panel. */
@Repository
public class AdminRepository {
    private final JdbcClient jdbc;

    public AdminRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    List<AccountRow> list(String query, String status, int limit, int offset) {
        return jdbc.sql("""
                SELECT a.id, a.email, a.created_at, a.email_verified, a.approved, a.blocked,
                       (SELECT count(*) FROM app.worlds w WHERE w.owner_account_id = a.id) AS world_count,
                       (SELECT count(*) FROM app.characters c WHERE c.owner_account_id = a.id) AS character_count
                FROM app.accounts a
                WHERE (:query = '' OR a.email ILIKE '%' || :query || '%')
                  AND (:status = 'all'
                       OR (:status = 'pending' AND a.approved = false)
                       OR (:status = 'approved' AND a.approved = true AND a.blocked = false)
                       OR (:status = 'blocked' AND a.blocked = true))
                ORDER BY a.created_at DESC, a.id DESC
                LIMIT :limit OFFSET :offset
                """).param("query", query).param("status", status).param("limit", limit).param("offset", offset)
                .query((rs, row) -> new AccountRow(rs.getObject("id", UUID.class), rs.getString("email"),
                        rs.getTimestamp("created_at").toInstant(), rs.getBoolean("email_verified"),
                        rs.getBoolean("approved"), rs.getBoolean("blocked"), rs.getInt("world_count"),
                        rs.getInt("character_count"))).list();
    }

    long count(String query, String status) {
        return jdbc.sql("""
                SELECT count(*) FROM app.accounts a
                WHERE (:query = '' OR a.email ILIKE '%' || :query || '%')
                  AND (:status = 'all'
                       OR (:status = 'pending' AND a.approved = false)
                       OR (:status = 'approved' AND a.approved = true AND a.blocked = false)
                       OR (:status = 'blocked' AND a.blocked = true))
                """).param("query", query).param("status", status).query(Long.class).single();
    }

    Optional<LockedAccount> lock(UUID account) {
        return jdbc.sql("""
                SELECT id, email, approved, blocked FROM app.accounts WHERE id = :id FOR UPDATE
                """).param("id", account).query((rs, row) -> new LockedAccount(rs.getObject("id", UUID.class),
                        rs.getString("email"), rs.getBoolean("approved"), rs.getBoolean("blocked"))).optional();
    }

    void approve(UUID account) {
        jdbc.sql("UPDATE app.accounts SET approved = true WHERE id = :id").param("id", account).update();
    }

    void block(UUID account, boolean blocked) {
        jdbc.sql("UPDATE app.accounts SET blocked = :blocked WHERE id = :id")
                .param("id", account).param("blocked", blocked).update();
    }

    void deleteCharacters(UUID account) {
        jdbc.sql("DELETE FROM app.characters WHERE owner_account_id = :id").param("id", account).update();
    }

    void deleteAccount(UUID account) {
        jdbc.sql("DELETE FROM app.accounts WHERE id = :id").param("id", account).update();
    }

    void audit(UUID actor, String action, UUID target, String targetEmail) {
        jdbc.sql("""
                INSERT INTO app.admin_audit_log (id, actor_account_id, action, target_account_id, target_email)
                VALUES (:id, :actor, :action, :target, :targetEmail)
                """).param("id", UUID.randomUUID()).param("actor", actor).param("action", action)
                .param("target", target).param("targetEmail", targetEmail).update();
    }

    List<AuditRow> auditList(int limit, int offset) {
        return jdbc.sql("""
                SELECT id, actor_account_id, action, target_account_id, target_email, created_at
                FROM app.admin_audit_log ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset
                """).param("limit", limit).param("offset", offset)
                .query((rs, row) -> new AuditRow(rs.getObject("id", UUID.class),
                        rs.getObject("actor_account_id", UUID.class), rs.getString("action"),
                        rs.getObject("target_account_id", UUID.class), rs.getString("target_email"),
                        rs.getTimestamp("created_at").toInstant())).list();
    }

    long auditCount() {
        return jdbc.sql("SELECT count(*) FROM app.admin_audit_log").query(Long.class).single();
    }

    record AccountRow(UUID id, String email, Instant createdAt, boolean emailVerified, boolean approved, boolean blocked,
                      int worldCount, int characterCount) {
    }

    record LockedAccount(UUID id, String email, boolean approved, boolean blocked) {
    }

    record AuditRow(UUID id, UUID actorAccountId, String action, UUID targetAccountId, String targetEmail,
                    Instant createdAt) {
    }
}
