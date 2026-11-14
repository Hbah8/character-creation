package ru.hbah8.charactercreation.backend.identity;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

/** Resolves live account access state instead of trusting data serialized in a session. */
@Service
public class AccountAccessService {
    private final AccountRepository accounts;
    private final Set<UUID> administratorIds;

    /**
     * Creates the account access resolver.
     *
     * @param accounts account state repository
     * @param properties immutable server configuration
     */
    public AccountAccessService(AccountRepository accounts, IdentityProperties properties) {
        this.accounts = accounts;
        this.administratorIds = Set.copyOf(properties.adminAccountIds());
    }

    /**
     * Requires approval or active administrator access before a user-owned write.
     *
     * @param account account identifier from the current session
     */
    public void requireApproved(UUID account) {
        if (!isApproved(account)) {
            throw new IdentityException(403, "accountPendingApproval");
        }
    }

    /**
     * Resolves effective approval without permanently approving configured administrators.
     *
     * @param account account identifier from the current session
     * @return whether approval is stored or supplied by active administrator access
     */
    public boolean isApproved(UUID account) {
        var current = accounts.byId(account).orElseThrow(() -> new IdentityException(401, "unauthenticated"));
        return current.approved() || isAdministrator(current);
    }

    /**
     * Resolves administrator status from current configuration and account data.
     *
     * @param account account identifier from the current session
     * @return whether the account is a verified configured administrator
     */
    public boolean isAdministrator(UUID account) {
        return accounts.byId(account)
                .map(this::isAdministrator)
                .orElse(false);
    }

    private boolean isAdministrator(AccountRepository.Account account) {
        return administratorIds.contains(account.id()) && account.verified() && !account.blocked();
    }
}
