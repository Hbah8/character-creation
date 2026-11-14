package ru.hbah8.charactercreation.backend.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.session.web.http.CookieSerializer;

import java.util.Map;
import java.util.List;
import java.util.UUID;
import ru.hbah8.charactercreation.backend.identity.IdentityProperties;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductionIdentityConfigurationTest {
    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(IdentityProperties.class)
    static class IdentityConfiguration {
    }

    @Test
    void administratorIdsAreLoadedFromEnvironmentInBothProfiles() throws Exception {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        for (String resource : List.of("application.yml", "application-prod.yml")) {
            var env = new MockEnvironment().withProperty("ADMIN_ACCOUNT_IDS", first + "," + second);
            env.getPropertySources().addLast(new YamlPropertySourceLoader()
                    .load(resource, new ClassPathResource(resource)).getFirst());
            assertEquals(List.of(first, second), Binder.get(env).bind("app.identity.admin-account-ids",
                    Bindable.listOf(UUID.class)).orElse(List.of()), resource);
        }
    }

    @Test
    void malformedAdministratorIdsFailStartupWhileEmptyConfigurationIsAllowed() {
        var runner = new ApplicationContextRunner().withUserConfiguration(IdentityConfiguration.class)
                .withPropertyValues("app.identity.registration-enabled=true");
        runner.withPropertyValues("app.identity.admin-account-ids=not-a-uuid").run(context ->
                assertNotNull(context.getStartupFailure(), "Malformed administrator identity must fail closed"));
        runner.withPropertyValues("app.identity.admin-account-ids=").run(context ->
                assertNull(context.getStartupFailure()));
    }

    @Test
    void developmentUsesLocalCaptureEvenIfProductionSmtpVariablesArePresent() throws Exception {
        var env = new MockEnvironment().withProperty("SMTP_HOST", "smtp.gmail.com")
                .withProperty("SMTP_USERNAME", "unused@example.test").withProperty("SMTP_PASSWORD", "unused");
        env.getPropertySources().addLast(new YamlPropertySourceLoader()
                .load("dev", new ClassPathResource("application-dev.yml")).getFirst());
        assertAll(
                () -> assertEquals("localhost", env.getProperty("spring.mail.host")),
                () -> assertEquals("1025", env.getProperty("spring.mail.port")),
                () -> assertEquals("", env.getProperty("spring.mail.password")),
                () -> assertEquals("false", env.getProperty("spring.mail.properties.mail.smtp.auth"))
        );
    }

    @Test
    void productionCookiesAreHttpOnlySecureAndSmtpRequiresAuthenticatedStarttls() throws Exception {
        var env = new MockEnvironment();
        env.setActiveProfiles("prod");
        var response = new MockHttpServletResponse();
        new SecurityConfiguration().sessionCookie(env).writeCookieValue(
                new CookieSerializer.CookieValue(new MockHttpServletRequest(), response, "not-a-real-session"));
        String cookie = response.getHeader("Set-Cookie");
        assertAll(
                () -> assertTrue(cookie.contains("Secure")),
                () -> assertTrue(cookie.contains("HttpOnly")),
                () -> assertTrue(cookie.contains("SameSite=Lax"))
        );
        var source = new YamlPropertySourceLoader().load("prod", new ClassPathResource("application-prod.yml")).getFirst();
        env.getPropertySources().addLast(source);
        Map<String, String> smtp = Binder.get(env).bind("spring.mail.properties",
                Bindable.mapOf(String.class, String.class)).orElseThrow(IllegalStateException::new);
        assertAll(
                () -> assertEquals("true", smtp.get("mail.smtp.auth")),
                () -> assertEquals("true", smtp.get("mail.smtp.starttls.enable")),
                () -> assertEquals("true", smtp.get("mail.smtp.starttls.required")),
                () -> assertEquals("true", smtp.get("mail.smtp.ssl.checkserveridentity")),
                () -> assertEquals("false", env.getProperty("app.identity.registration-enabled")),
                () -> assertEquals("native", env.getProperty("server.forward-headers-strategy"))
        );
    }
}
