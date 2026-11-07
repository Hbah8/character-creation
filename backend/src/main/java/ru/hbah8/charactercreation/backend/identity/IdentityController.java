package ru.hbah8.charactercreation.backend.identity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;

/** HTTP-only account boundary; private operations require server authentication. */
@RestController
@RequestMapping("/api/auth")
public class IdentityController {
    private static final String EMAIL_PATTERN =
            "[^\\s@]+@[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)+";
    private final AccountService accounts;
    private final AccountRepository repository;
    private final RequestLimits limits;
    private final VerificationMailSender mail;
    private final AuthenticationManager authentication;
    private final SessionAuthenticationStrategy sessionStrategy;
    private final SecurityContextRepository contexts;
    private final SessionService sessions;

    public IdentityController(AccountService accounts, AccountRepository repository, RequestLimits limits,
                              VerificationMailSender mail, AuthenticationManager authentication,
                              SessionAuthenticationStrategy sessionStrategy, SecurityContextRepository contexts,
                              SessionService sessions) {
        this.accounts = accounts;
        this.repository = repository;
        this.limits = limits;
        this.mail = mail;
        this.authentication = authentication;
        this.sessionStrategy = sessionStrategy;
        this.contexts = contexts;
        this.sessions = sessions;
    }

    record Credentials(@NotBlank @Email(regexp = EMAIL_PATTERN) @Size(max = 254) String email,
                       @NotBlank @Size(min = 12, max = 128) String password) {
        Credentials {
            email = email == null ? null : email.strip();
        }

        @Override
        public String toString() {
            return "Credentials[redacted]";
        }
    }

    record EmailRequest(@NotBlank @Email(regexp = EMAIL_PATTERN) @Size(max = 254) String email) {
        EmailRequest {
            email = email == null ? null : email.strip();
        }
    }

    record LoginCredentials(@NotBlank @Email(regexp = EMAIL_PATTERN) @Size(max = 254) String email,
                            @NotBlank @Size(max = 128) String password) {
        LoginCredentials {
            email = email == null ? null : email.strip();
        }

        @Override
        public String toString() {
            return "LoginCredentials[redacted]";
        }
    }

    record TokenRequest(@NotBlank @Size(max = 128) String token) {
        @Override
        public String toString() {
            return "TokenRequest[redacted]";
        }
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody Credentials input, HttpServletRequest request) {
        checkLimit("mail", input.email(), request);
        accounts.register(input.email(), input.password()).ifPresent(delivery ->
                mail.sendVerification(delivery.email(), delivery.url()));
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/resend")
    public ResponseEntity<Void> resend(@Valid @RequestBody EmailRequest input, HttpServletRequest request) {
        checkLimit("mail", input.email(), request);
        accounts.resend(input.email()).ifPresent(delivery ->
                mail.sendVerification(delivery.email(), delivery.url()));
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/confirm")
    public ResponseEntity<Void> confirm(@Valid @RequestBody TokenRequest input) {
        accounts.confirm(input.token());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public CurrentAccount login(@Valid @RequestBody LoginCredentials input,
                                              HttpServletRequest request, HttpServletResponse response) {
        checkLimit("login", input.email(), request);
        Authentication result = authentication.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(AccountService.normalize(input.email()), input.password()));
        request.getSession();
        sessionStrategy.onAuthentication(result, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(result);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return me(result, request);
    }

    @GetMapping("/me")
    public CurrentAccount me(Authentication authentication, HttpServletRequest request) {
        var account = repository.view(UUID.fromString(authentication.getName()));
        var session = request.getSession(false);
        return new CurrentAccount(account.id(), account.email(),
                Instant.ofEpochMilli(session.getLastAccessedTime()).plusSeconds(session.getMaxInactiveInterval()));
    }

    /** Safe current-account metadata used to close an idle client at session expiry. */
    public record CurrentAccount(UUID id, String email, Instant expiresAt) {
    }

    @GetMapping("/sessions")
    public List<SessionService.SessionView> sessions(Authentication authentication, HttpServletRequest request) {
        return sessions.list(authentication.getName(), request.getSession(false).getId());
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> revoke(@PathVariable UUID id, Authentication authentication, HttpServletRequest request) {
        var current = request.getSession(false);
        if (sessions.revoke(authentication.getName(), id, current.getId())) {
            current.invalidate();
            SecurityContextHolder.clearContext();
        }
        return ResponseEntity.noContent().build();
    }

    private void checkLimit(String action, String email, HttpServletRequest request) {
        if (!limits.allow(action, email, request.getRemoteAddr())) {
            throw new IdentityException(429, "rateLimited");
        }
    }
}
