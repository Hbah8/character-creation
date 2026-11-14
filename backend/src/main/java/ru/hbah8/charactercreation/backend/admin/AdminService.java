package ru.hbah8.charactercreation.backend.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.hbah8.charactercreation.backend.identity.AccountRepository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Transaction boundary for administrative account actions and immutable audit records. */
@Service
public class AdminService {
    private static final Set<String> STATUSES = Set.of("all", "pending", "approved", "blocked");
    private final AdminRepository administration;
    private final AccountRepository accounts;

    public AdminService(AdminRepository administration, AccountRepository accounts) {
        this.administration = administration;
        this.accounts = accounts;
    }

    @Transactional(readOnly = true)
    public AccountPage accounts(String query, String status, int page, int size) {
        if (!STATUSES.contains(status)) {
            throw new AdminException(400, "invalidInput");
        }
        return new AccountPage(administration.list(query, status, size, page * size).stream()
                .map(AccountView::from).toList(),
                administration.count(query, status), page, size);
    }

    @Transactional
    public void approve(UUID actor, UUID target) {
        LockedAccount account = target(actor, target);
        if (!account.approved()) {
            administration.approve(target);
            administration.audit(actor, "approved", target, account.email());
        }
    }

    @Transactional
    public void block(UUID actor, UUID target, boolean blocked) {
        LockedAccount account = target(actor, target);
        if (account.blocked() != blocked) {
            administration.block(target, blocked);
            accounts.revokeSessions(target);
            administration.audit(actor, blocked ? "blocked" : "unblocked", target, account.email());
        }
    }

    @Transactional
    public void delete(UUID actor, UUID target) {
        LockedAccount account = target(actor, target);
        accounts.revokeSessions(target);
        administration.deleteCharacters(target);
        administration.deleteAccount(target);
        administration.audit(actor, "deleted", target, account.email());
    }

    @Transactional(readOnly = true)
    public AuditPage audit(int page, int size) {
        return new AuditPage(administration.auditList(size, page * size), administration.auditCount(), page, size);
    }

    private LockedAccount target(UUID actor, UUID target) {
        if (actor.equals(target)) {
            throw new AdminException(409, "selfActionForbidden");
        }
        return administration.lock(target)
                .map(account -> new LockedAccount(account.email(), account.approved(), account.blocked()))
                .orElseThrow(() -> new AdminException(404, "notFound"));
    }

    private record LockedAccount(String email, boolean approved, boolean blocked) {
    }

    public record AccountPage(List<AccountView> items, long total, int page, int size) {
    }

    public record AuditPage(List<AdminRepository.AuditRow> items, long total, int page, int size) {
    }

    /** Safe account list row with a locale-agnostic state key. */
    public record AccountView(UUID id, String email, java.time.Instant createdAt, boolean emailVerified, String status,
                              int worldCount, int characterCount) {
        static AccountView from(AdminRepository.AccountRow row) {
            String status = row.blocked() ? "blocked" : row.approved() ? "approved" : "pending";
            return new AccountView(row.id(), row.email(), row.createdAt(), row.emailVerified(), status,
                    row.worldCount(), row.characterCount());
        }
    }
}
