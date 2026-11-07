package ru.hbah8.charactercreation.backend.identity;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

/** Transaction boundary for registration and atomic one-time confirmation. */
@Service
public class AccountService {
    private final AccountRepository accounts;
    private final PasswordEncoder passwords;
    private final IdentityProperties properties;

    public AccountService(AccountRepository accounts, PasswordEncoder passwords, IdentityProperties properties) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.properties = properties;
    }

    record Delivery(String email, String url) {
        @Override
        public String toString() {
            return "Delivery[redacted]";
        }
    }

    static String normalize(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public Optional<Delivery> register(String email, String password) {
        String normalized = normalize(email);
        String hash = passwords.encode(password);
        return accounts.insert(normalized, hash).map(id -> issue(id, normalized));
    }

    @Transactional
    public Optional<Delivery> resend(String email) {
        return accounts.lockByEmail(normalize(email))
                .filter(account -> !account.verified())
                .map(account -> issue(account.id(), account.email()));
    }

    private Delivery issue(java.util.UUID account, String email) {
        String token = IdentitySecrets.newToken();
        accounts.replaceToken(account, IdentitySecrets.hash(token), Instant.now().plus(properties.verificationTtl()));
        String base = properties.publicBaseUrl().toString().replaceAll("/+$", "");
        return new Delivery(email, base + "/login#token=" + token);
    }

    @Transactional
    public void confirm(String token) {
        String hash = IdentitySecrets.hash(token);
        var account = accounts.accountForToken(hash)
                .orElseThrow(() -> new IdentityException(400, "invalidToken"));
        // All issuance/consumption locks the account before changing tokens.
        accounts.lock(account);
        if (!accounts.consumeToken(hash)) {
            throw new IdentityException(400, "invalidToken");
        }
        accounts.verify(account);
    }
}
