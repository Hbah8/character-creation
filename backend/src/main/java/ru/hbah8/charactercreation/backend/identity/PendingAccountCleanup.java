package ru.hbah8.charactercreation.backend.identity;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Removes stale unverified or unapproved registrations after their configured lifetime. */
@Component
public class PendingAccountCleanup {
    private final AccountRepository accounts;
    private final IdentityProperties properties;

    public PendingAccountCleanup(AccountRepository accounts, IdentityProperties properties) {
        this.accounts = accounts;
        this.properties = properties;
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void removeExpiredAccounts() {
        accounts.deleteExpiredPendingAccounts(Instant.now().minus(properties.pendingAccountTtl()),
                properties.adminAccountIds());
    }
}
