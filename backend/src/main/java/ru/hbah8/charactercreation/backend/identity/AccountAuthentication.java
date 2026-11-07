package ru.hbah8.charactercreation.backend.identity;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Resolves email credentials to a stable account UUID principal. */
@Service
public class AccountAuthentication implements UserDetailsService {
    private final AccountRepository accounts;

    public AccountAuthentication(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        var account = accounts.byEmail(AccountService.normalize(email))
                .orElseThrow(() -> new UsernameNotFoundException("invalidCredentials"));
        return User.withUsername(account.id().toString()).password(account.passwordHash())
                .disabled(!account.verified()).authorities("ROLE_ACCOUNT").build();
    }
}
