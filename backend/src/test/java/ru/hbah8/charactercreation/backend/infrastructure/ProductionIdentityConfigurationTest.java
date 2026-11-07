package ru.hbah8.charactercreation.backend.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.session.web.http.CookieSerializer;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductionIdentityConfigurationTest {
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
                () -> assertEquals("native", env.getProperty("server.forward-headers-strategy"))
        );
    }
}
