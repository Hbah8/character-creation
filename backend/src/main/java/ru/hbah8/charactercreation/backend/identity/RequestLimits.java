package ru.hbah8.charactercreation.backend.identity;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Shared PostgreSQL fixed-window limits, retained even when authentication fails. */
@Service
public class RequestLimits {
    private final JdbcClient jdbc;

    public RequestLimits(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean allow(String action, String email, String ip) {
        int ipLimit = action.equals("login") ? 30 : 10;
        int emailLimit = action.equals("login") ? 10 : 3;
        // Both counters advance even if the other limit was exceeded.
        boolean addressAllowed = increment(action + ":ip:" + ip, ipLimit);
        boolean emailAllowed = increment(action + ":email:" + AccountService.normalize(email), emailLimit);
        return addressAllowed && emailAllowed;
    }

    private boolean increment(String key, int maximum) {
        return jdbc.sql("""
                INSERT INTO app.request_limits (bucket_hash, attempts, expires_at)
                VALUES (:hash, 1, CURRENT_TIMESTAMP + interval '15 minutes')
                ON CONFLICT (bucket_hash) DO UPDATE SET
                    attempts = CASE WHEN app.request_limits.expires_at <= CURRENT_TIMESTAMP THEN 1
                                    ELSE LEAST(app.request_limits.attempts + 1, 1000000) END,
                    expires_at = CASE WHEN app.request_limits.expires_at <= CURRENT_TIMESTAMP
                                      THEN CURRENT_TIMESTAMP + interval '15 minutes'
                                      ELSE app.request_limits.expires_at END
                RETURNING attempts
                """).param("hash", IdentitySecrets.hash(key)).query(Integer.class).single() <= maximum;
    }

    @Scheduled(fixedDelay = 3600000)
    public void cleanExpired() {
        jdbc.sql("DELETE FROM app.request_limits WHERE expires_at < CURRENT_TIMESTAMP").update();
        jdbc.sql("DELETE FROM app.email_tokens WHERE expires_at < CURRENT_TIMESTAMP - interval '7 days'").update();
    }
}
