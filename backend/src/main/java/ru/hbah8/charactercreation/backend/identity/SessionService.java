package ru.hbah8.charactercreation.backend.identity;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Account-scoped session metadata and revocation without exposing bearer IDs. */
@Service
public class SessionService {
    private final JdbcClient jdbc;

    public SessionService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** The id is Spring Session's non-bearer primary key, never its cookie/session ID. */
    public record SessionView(UUID id, Instant createdAt, Instant lastAccessAt, Instant expiresAt, boolean current) {
    }

    public List<SessionView> list(String account, String currentSession) {
        return jdbc.sql("""
                SELECT primary_id, creation_time, last_access_time, expiry_time, session_id
                FROM app.spring_session WHERE principal_name = :account AND expiry_time > :now
                ORDER BY creation_time DESC, primary_id
                """).param("account", account).param("now", System.currentTimeMillis())
                .query((rs, row) -> new SessionView(UUID.fromString(rs.getString("primary_id")),
                        Instant.ofEpochMilli(rs.getLong("creation_time")),
                        Instant.ofEpochMilli(rs.getLong("last_access_time")),
                        Instant.ofEpochMilli(rs.getLong("expiry_time")),
                        currentSession.equals(rs.getString("session_id")))).list();
    }

    @Transactional
    public boolean revoke(String account, UUID handle, String currentSession) {
        List<String> deleted = jdbc.sql("""
                DELETE FROM app.spring_session
                WHERE primary_id = :handle AND principal_name = :account AND expiry_time > :now
                RETURNING session_id
                """).param("handle", handle.toString()).param("account", account)
                .param("now", System.currentTimeMillis()).query(String.class).list();
        if (deleted.isEmpty()) {
            throw new IdentityException(404, "sessionNotFound");
        }
        return currentSession.equals(deleted.getFirst());
    }
}
