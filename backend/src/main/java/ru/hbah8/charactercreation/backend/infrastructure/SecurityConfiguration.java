package ru.hbah8.charactercreation.backend.infrastructure;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.session.web.http.DefaultCookieSerializer;
import ru.hbah8.charactercreation.backend.identity.IdentityProperties;

import java.util.List;

/** Same-origin cookie security with explicit context persistence for JSON login. */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(IdentityProperties.class)
public class SecurityConfiguration {
    @Bean
    PasswordEncoder passwords() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    @Bean
    AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder passwords) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwords);
        // Defer email verification until the password has been validated.
        provider.setPreAuthenticationChecks(user -> {
            if (!user.isAccountNonLocked()) throw new LockedException("invalidCredentials");
            if (!user.isAccountNonExpired()) throw new AccountExpiredException("invalidCredentials");
        });
        provider.setPostAuthenticationChecks(user -> {
            if (!user.isCredentialsNonExpired()) throw new CredentialsExpiredException("invalidCredentials");
            if (!user.isEnabled()) throw new DisabledException("emailUnverified");
        });
        return new ProviderManager(provider);
    }

    @Bean
    SecurityContextRepository contexts() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    CsrfTokenRepository csrfTokens() {
        return new HttpSessionCsrfTokenRepository();
    }

    @Bean
    SessionAuthenticationStrategy sessionStrategy(CsrfTokenRepository tokens) {
        return new CompositeSessionAuthenticationStrategy(List.of(
                new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(tokens)));
    }

    @Bean
    DefaultCookieSerializer sessionCookie(Environment environment) {
        var serializer = new DefaultCookieSerializer();
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(environment.matchesProfiles("prod"));
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        return serializer;
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, SecurityContextRepository contexts,
                                 CsrfTokenRepository tokens) throws Exception {
        return http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/me", "/api/auth/sessions", "/api/auth/sessions/**",
                                "/api/auth/password-change", "/api/characters", "/api/characters/**").authenticated()
                        .requestMatchers("/api/auth/csrf", "/api/auth/register", "/api/auth/resend",
                                "/api/auth/confirm", "/api/auth/login", "/api/auth/logout",
                                "/api/auth/password-reset/request", "/api/auth/password-reset/complete",
                                "/actuator/health", "/actuator/health/**", "/error").permitAll()
                        .anyRequest().denyAll())
                .csrf(csrf -> csrf.csrfTokenRepository(tokens))
                .securityContext(context -> context.securityContextRepository(contexts))
                .requestCache(cache -> cache.disable())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"code\":\"unauthenticated\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"code\":\"forbidden\"}");
                        }))
                .logout(logout -> logout.logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
                .build();
    }
}
