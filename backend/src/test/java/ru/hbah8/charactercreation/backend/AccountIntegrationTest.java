package ru.hbah8.charactercreation.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import ru.hbah8.charactercreation.backend.application.CharacterCreationApplication;
import ru.hbah8.charactercreation.backend.identity.VerificationMailSender;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class AccountIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");
    static final Map<String, String> letters = new ConcurrentHashMap<>();
    static final ObjectMapper json = new ObjectMapper();
    static ConfigurableApplicationContext app;
    static String base;
    static JdbcTemplate jdbc;
    static JsonNode characterFixture;

    @TestConfiguration(proxyBeanMethods = false)
    static class MailCapture {
        @Bean
        @Primary
        VerificationMailSender capturedMail() {
            return new VerificationMailSender() {
                public void sendVerification(String email, String url) { letters.put(email, url); }
                public void sendPasswordReset(String email, String url) { letters.put(email, url); }
            };
        }
    }

    @BeforeAll
    static void start() {
        app = new SpringApplicationBuilder(CharacterCreationApplication.class, MailCapture.class)
                .profiles("test")
                .run("--server.port=0", "--spring.docker.compose.enabled=false",
                        "--spring.datasource.url=" + postgres.getJdbcUrl(),
                        "--spring.datasource.username=" + postgres.getUsername(),
                        "--spring.datasource.password=" + postgres.getPassword(),
                        "--app.identity.public-base-url=http://localhost:5173",
                        "--spring.session.jdbc.initialize-schema=never");
        base = "http://localhost:" + app.getEnvironment().getProperty("local.server.port");
        jdbc = app.getBean(JdbcTemplate.class);
        try (var fixture = AccountIntegrationTest.class.getResourceAsStream("/fixtures/character-rich.json")) {
            characterFixture = json.readTree(fixture);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not read character test fixture", exception);
        }
    }

    @AfterAll
    static void stop() {
        if (app != null) {
            app.close();
        }
    }

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE app.spring_session, app.accounts, app.request_limits CASCADE");
        letters.clear();
    }

    @Test
    void emailRequiresFullDomainBeforeAnyRegistrationOrResendSideEffects() throws Exception {
        Browser browser = new Browser();
        for (String email : new String[]{"test@test", "test@localhost", "test@.com", "test@example.",
                "test@exam..com", "test@-example.com", "test@example-.com"}) {
            assertEquals(400, browser.post("/register", credentials(email)).statusCode(), email);
            assertEquals(400, browser.post("/resend", Map.of("email", email)).statusCode(), email);
        }
        assertAll(
                () -> assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.accounts", Integer.class)),
                () -> assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.email_tokens", Integer.class)),
                () -> assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.request_limits", Integer.class)),
                () -> assertTrue(letters.isEmpty())
        );
        for (String email : new String[]{"user@example.com", "user+tag@sub.example.test"}) {
            assertEquals(202, browser.post("/register", credentials(email)).statusCode(), email);
            assertTrue(letters.containsKey(email));
            assertEquals(202, browser.post("/resend", Map.of("email", email)).statusCode(), email);
        }
    }

    @Test
    void loginOnlyDisclosesUnverifiedEmailAfterCorrectPassword() throws Exception {
        Browser browser = new Browser();
        browser.post("/register", credentials("unverified@example.com"));
        var unknown = browser.post("/login", credentials("unknown@example.com"));
        var wrong = browser.post("/login", Map.of(
                "email", "unverified@example.com", "password", "incorrect valid-length password"));
        var shortPassword = browser.post("/login", Map.of("email", "unverified@example.com", "password", "wrong"));
        var unverified = browser.post("/login", credentials("unverified@example.com"));
        assertAll(
                () -> assertEquals(401, unknown.statusCode()),
                () -> assertEquals("invalidCredentials", json.readTree(unknown.body()).path("code").asText()),
                () -> assertEquals(unknown.body(), wrong.body()),
                () -> assertEquals(unknown.body(), shortPassword.body()),
                () -> assertEquals(401, shortPassword.statusCode()),
                () -> assertEquals(401, wrong.statusCode()),
                () -> assertEquals(401, unverified.statusCode()),
                () -> assertEquals("emailUnverified", json.readTree(unverified.body()).path("code").asText()),
                () -> assertEquals(401, browser.request("GET", "/me", null, false).statusCode())
        );
        browser.post("/confirm", Map.of("token", token("unverified@example.com")));
        assertEquals("invalidCredentials", json.readTree(browser.post("/login", Map.of(
                "email", "unverified@example.com", "password", "incorrect valid-length password")).body())
                .path("code").asText());
    }

    @Test
    void protectedApisRejectAnonymousAndExpiredSessionsWithoutRelyingOnNavigation() throws Exception {
        Browser browser = new Browser();
        assertEquals(401, browser.request("GET", "/me", null, false).statusCode());
        assertEquals(401, browser.request("GET", "/sessions", null, false).statusCode());
        assertEquals(401, browser.delete("/sessions/" + java.util.UUID.randomUUID()).statusCode());
        browser = verifiedBrowser("timeout@example.com");
        JsonNode current = browser.get("/me");
        assertTrue(Instant.parse(current.path("expiresAt").asText()).isAfter(Instant.now()));
        jdbc.update("""
                UPDATE app.spring_session SET last_access_time = ?, expiry_time = ?
                WHERE principal_name IS NOT NULL
                """, System.currentTimeMillis() - Duration.ofDays(31).toMillis(), System.currentTimeMillis() - 1000);
        assertEquals(401, browser.request("GET", "/me", null, false).statusCode());
        assertEquals(401, browser.request("GET", "/sessions", null, false).statusCode());
        assertEquals(401, browser.delete("/sessions/" + java.util.UUID.randomUUID()).statusCode());
        assertEquals(200, browser.request("GET", "/csrf", null, false).statusCode());
    }

    @Test
    void registrationConfirmationAndLoginUseHashedSecretsAndRotatedPersistentSessions() throws Exception {
        Browser browser = new Browser();
        var registration = browser.post("/register", credentials("  Player@Example.com "));
        assertEquals(202, registration.statusCode());
        String token = token("player@example.com");
        String passwordHash = jdbc.queryForObject("SELECT password_hash FROM app.accounts", String.class);
        assertTrue(passwordHash.startsWith("$argon2id$"));
        assertNotEquals("correct horse battery staple", passwordHash);
        assertNotEquals(token, jdbc.queryForObject("SELECT token_hash FROM app.email_tokens", String.class));
        assertEquals(401, browser.post("/login", credentials("player@example.com")).statusCode());
        assertEquals(204, browser.post("/confirm", Map.of("token", token)).statusCode());
        assertEquals(400, browser.post("/confirm", Map.of("token", token)).statusCode());
        assertEquals(401, browser.post("/login",
                Map.of("email", "player@example.com", "password", "incorrect valid-length password")).statusCode());
        String before = browser.sessionCookie();
        assertEquals(200, browser.post("/login", credentials("PLAYER@example.com")).statusCode());
        assertNotEquals(before, browser.sessionCookie());
        assertEquals("player@example.com", browser.get("/me").path("email").asText());
        JsonNode sessions = browser.get("/sessions");
        assertEquals(1, sessions.size());
        assertTrue(sessions.get(0).path("current").asBoolean());
        String serialized = sessions.toString().toLowerCase();
        String bearer = jdbc.queryForObject(
                "SELECT session_id FROM app.spring_session WHERE principal_name IS NOT NULL", String.class);
        assertAll(
                () -> assertFalse(serialized.contains("sessionid")),
                () -> assertFalse(serialized.contains(browser.sessionCookie())),
                () -> assertFalse(serialized.contains(bearer)),
                () -> assertFalse(serialized.contains("password")),
                () -> assertFalse(serialized.contains("token"))
        );
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM app.spring_session WHERE principal_name IS NOT NULL", Integer.class));
        stop();
        start();
        assertEquals("player@example.com", browser.get("/me").path("email").asText());
        assertEquals(204, browser.post("/logout", Map.of()).statusCode());
        assertEquals(401, browser.request("GET", "/me", null, false).statusCode());
    }

    @Test
    void expiredResentAndConcurrentTokensCannotBeReused() throws Exception {
        Browser browser = new Browser();
        browser.post("/register", credentials("expiry@example.com"));
        String first = token("expiry@example.com");
        jdbc.update("UPDATE app.email_tokens SET expires_at = now() - interval '1 second'");
        assertEquals(400, browser.post("/confirm", Map.of("token", first)).statusCode());
        assertEquals(202, browser.post("/resend", Map.of("email", "expiry@example.com")).statusCode());
        String next = token("expiry@example.com");
        assertNotEquals(first, next);
        assertEquals(400, browser.post("/confirm", Map.of("token", first)).statusCode());
        try (var pool = Executors.newFixedThreadPool(2)) {
            var one = pool.submit(() -> new Browser().post("/confirm", Map.of("token", next)).statusCode());
            var two = pool.submit(() -> new Browser().post("/confirm", Map.of("token", next)).statusCode());
            assertEquals(604, one.get() + two.get(), "Exactly one confirmation must return 204, the other 400");
        }
        assertEquals(202, browser.post("/resend", Map.of("email", "expiry@example.com")).statusCode());
        assertEquals(next, token("expiry@example.com"), "Verified accounts must not receive another token");
    }

    @Test
    void registrationAndResendDoNotRevealAccountExistenceOrReplacePasswords() throws Exception {
        Browser browser = new Browser();
        var fresh = browser.post("/register", credentials("same@example.com"));
        String originalToken = token("same@example.com");
        String originalHash = jdbc.queryForObject("SELECT password_hash FROM app.accounts", String.class);
        var duplicate = browser.post("/register",
                Map.of("email", "SAME@example.com", "password", "different valid password"));
        assertAll(
                () -> assertEquals(fresh.statusCode(), duplicate.statusCode()),
                () -> assertEquals(fresh.body(), duplicate.body()),
                () -> assertEquals(originalHash, jdbc.queryForObject("SELECT password_hash FROM app.accounts", String.class)),
                () -> assertEquals(originalToken, token("same@example.com"))
        );
        var known = browser.post("/resend", Map.of("email", "same@example.com"));
        var unknown = browser.post("/resend", Map.of("email", "unknown@example.com"));
        assertEquals(known.body(), unknown.body());
        assertEquals(known.statusCode(), unknown.statusCode());
        assertFalse(letters.containsKey("unknown@example.com"));
    }

    @Test
    void sessionOwnershipRevocationAndLogoutAreEnforced() throws Exception {
        Browser alice = verifiedBrowser("alice@example.com");
        Browser second = new Browser();
        assertEquals(200, second.post("/login", credentials("alice@example.com")).statusCode());
        Browser bob = verifiedBrowser("bob@example.com");
        String otherHandle = bob.get("/sessions").get(0).path("id").asText();
        assertEquals(404, alice.delete("/sessions/" + otherHandle).statusCode());
        assertEquals(1, bob.get("/sessions").size());
        JsonNode sessions = alice.get("/sessions");
        assertEquals(2, sessions.size());
        assertFalse(sessions.toString().contains(otherHandle), "Another account's session must not be listed");
        JsonNode other = sessions.get(0).path("current").asBoolean() ? sessions.get(1) : sessions.get(0);
        assertEquals(204, alice.delete("/sessions/" + other.path("id").asText()).statusCode());
        assertEquals(401, second.request("GET", "/me", null, false).statusCode());
        String current = alice.get("/sessions").get(0).path("id").asText();
        assertEquals(204, alice.delete("/sessions/" + current).statusCode());
        assertEquals(401, alice.request("GET", "/sessions", null, false).statusCode());
        assertEquals("bob@example.com", bob.get("/me").path("email").asText());
    }

    @Test
    void csrfProtectsAllMutationsAndLimitsSurviveRejectedLogin() throws Exception {
        Browser browser = new Browser();
        assertEquals(403, browser.request("POST", "/register", credentials("csrf@example.com"), false).statusCode());
        assertEquals(403, browser.request("POST", "/login", credentials("csrf@example.com"), false).statusCode());
        assertEquals(403, browser.request("POST", "/confirm", Map.of("token", "anything"), false).statusCode());
        assertEquals(403, browser.request("POST", "/resend", Map.of("email", "csrf@example.com"), false).statusCode());
        for (int attempt = 0; attempt < 10; attempt++) {
            assertEquals(401, browser.post("/login", credentials("missing@example.com")).statusCode());
        }
        assertEquals(429, browser.post("/login", credentials("missing@example.com")).statusCode());
        for (int attempt = 0; attempt < 3; attempt++) {
            assertEquals(202, browser.post("/resend", Map.of("email", "missing@example.com")).statusCode());
        }
        assertEquals(429, browser.post("/register", credentials("missing@example.com")).statusCode());
        jdbc.update("UPDATE app.request_limits SET expires_at = now() - interval '1 second'");
        assertEquals(401, browser.post("/login", credentials("missing@example.com")).statusCode());
        Browser authenticated = verifiedBrowser("csrf@example.com");
        String handle = authenticated.get("/sessions").get(0).path("id").asText();
        assertEquals(403, authenticated.request("DELETE", "/sessions/" + handle, null, false).statusCode());
        assertEquals(403, authenticated.request("POST", "/logout", Map.of(), false).statusCode());
    }

    @Test
    void ipLimitsCannotBeBypassedByChangingEmailOrForwardedHeaders() throws Exception {
        Browser browser = new Browser();
        for (int attempt = 0; attempt < 30; attempt++) {
            assertEquals(401, browser.post("/login", credentials("missing" + attempt + "@example.com")).statusCode());
        }
        assertEquals(429, browser.post("/login", credentials("fresh@example.com")).statusCode());
        for (int attempt = 0; attempt < 10; attempt++) {
            assertEquals(202, browser.post("/resend", Map.of("email", "missing" + attempt + "@example.com")).statusCode());
        }
        assertEquals(429, browser.post("/resend", Map.of("email", "another@example.com")).statusCode());
    }

    @Test
    void inputValidationRejectsMalformedRequests() throws Exception {
        Browser browser = new Browser();
        assertEquals(400, browser.post("/register", Map.of("email", "invalid", "password", "short")).statusCode());
        assertEquals(400, browser.post("/confirm", Map.of("token", "")).statusCode());
        assertEquals(400, browser.post("/register",
                Map.of("email", "valid@example.com", "password", "a".repeat(129))).statusCode());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.accounts", Integer.class));
    }

    @Test
    void savedCharactersArePrivateVersionedAndPreserveCompleteCharacterJson() throws Exception {
        Browser owner = verifiedBrowser("character-owner@example.com");
        Browser other = verifiedBrowser("character-other@example.com");
        String ownerId = owner.get("/me").path("id").asText();
        String otherId = other.get("/me").path("id").asText();

        ObjectNode create = json.createObjectNode();
        create.set("character", characterFixture.deepCopy());
        create.put("ownerAccountId", otherId);
        var created = owner.characterRequest("POST", "", create, null, true);

        assertEquals(201, created.statusCode(), created.body());
        JsonNode saved = json.readTree(created.body());
        String characterId = saved.path("id").asText();
        assertEquals("\"1\"", created.headers().firstValue("ETag").orElseThrow());
        assertEquals(ownerId, jdbc.queryForObject(
                "SELECT owner_account_id::text FROM app.characters WHERE id = ?::uuid", String.class, characterId));
        assertEquals(characterFixture, saved.path("character"));

        var ownerList = owner.characterRequest("GET", "", null, null, false);
        var otherList = other.characterRequest("GET", "", null, null, false);
        assertEquals(200, ownerList.statusCode());
        assertEquals(1, json.readTree(ownerList.body()).size());
        assertEquals(200, otherList.statusCode());
        assertEquals(0, json.readTree(otherList.body()).size());

        var foreignRead = other.characterRequest("GET", "/" + characterId, null, null, false);
        var foreignUpdate = other.characterRequest("PUT", "/" + characterId,
                Map.of("character", characterFixture), "\"1\"", true);
        var foreignDelete = other.characterRequest("DELETE", "/" + characterId, null, "\"1\"", true);
        assertEquals(404, foreignRead.statusCode());
        assertEquals(404, foreignUpdate.statusCode());
        assertEquals(404, foreignDelete.statusCode());

        ObjectNode changedCharacter = (ObjectNode) characterFixture.deepCopy();
        changedCharacter.put("callsign", "Scout updated");
        var updateBody = json.createObjectNode().set("character", changedCharacter);
        var updated = owner.characterRequest("PUT", "/" + characterId, updateBody, "\"1\"", true);
        assertEquals(200, updated.statusCode(), updated.body());
        assertEquals("\"2\"", updated.headers().firstValue("ETag").orElseThrow());
        assertEquals(changedCharacter, json.readTree(updated.body()).path("character"));

        ObjectNode staleDraft = (ObjectNode) characterFixture.deepCopy();
        staleDraft.put("callsign", "Draft from stale browser");
        var staleUpdate = owner.characterRequest("PUT", "/" + characterId,
                Map.of("character", staleDraft), "\"1\"", true);
        assertEquals(409, staleUpdate.statusCode());
        assertEquals("conflict", json.readTree(staleUpdate.body()).path("code").asText());
        assertEquals("Scout updated", owner.characterRequest("GET", "/" + characterId, null, null, false)
                .body().contains("Scout updated") ? "Scout updated" : "missing updated character");

        assertEquals(409, owner.characterRequest("DELETE", "/" + characterId, null, "\"1\"", true).statusCode());
        assertEquals(204, owner.characterRequest("DELETE", "/" + characterId, null, "\"2\"", true).statusCode());
        assertEquals(404, owner.characterRequest("GET", "/" + characterId, null, null, false).statusCode());
    }

    @Test
    void savedCharacterEndpointsRequireSessionValidateStandaloneDataAndLimitRequestSize() throws Exception {
        Browser anonymous = new Browser();
        String id = java.util.UUID.randomUUID().toString();
        assertEquals(401, anonymous.characterRequest("GET", "", null, null, false).statusCode());
        assertEquals(401, anonymous.characterRequest("GET", "/" + id, null, null, false).statusCode());
        assertEquals(401, anonymous.characterRequest("POST", "", Map.of("character", characterFixture), null, true).statusCode());
        assertEquals(401, anonymous.characterRequest("PUT", "/" + id,
                Map.of("character", characterFixture), "\"1\"", true).statusCode());
        assertEquals(401, anonymous.characterRequest("DELETE", "/" + id, null, "\"1\"", true).statusCode());

        Browser owner = verifiedBrowser("character-validation@example.com");
        ObjectNode portrait = (ObjectNode) characterFixture.deepCopy();
        portrait.put("portraitUrl", "data:image/png;base64,not-stored");
        assertEquals("unsupportedData", json.readTree(owner.characterRequest("POST", "",
                Map.of("character", portrait), null, true).body()).path("code").asText());

        ObjectNode worldCharacter = (ObjectNode) characterFixture.deepCopy();
        worldCharacter.put("worldId", java.util.UUID.randomUUID().toString());
        assertEquals("unsupportedData", json.readTree(owner.characterRequest("POST", "",
                Map.of("character", worldCharacter), null, true).body()).path("code").asText());
        assertEquals("invalidCharacter", json.readTree(owner.characterRequest("POST", "",
                Map.of("character", Map.of("callsign", "incomplete")), null, true).body()).path("code").asText());

        String oversized = "{\"character\":" + characterFixture + ",\"padding\":\"" + "x".repeat(2_100_000) + "\"}";
        assertEquals(413, owner.characterRequest("POST", "", oversized, null, true).statusCode());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM app.characters", Integer.class));
    }

    @Test
    void resetIsNeutralSingleUseAndRevokesAllSessions() throws Exception {
        Browser first = verifiedBrowser("reset@example.com");
        Browser second = new Browser();
        assertEquals(200, second.post("/login", credentials("reset@example.com")).statusCode());
        var known = first.post("/password-reset/request", Map.of("email", "reset@example.com"));
        var unknown = first.post("/password-reset/request", Map.of("email", "unknown@example.com"));
        assertEquals(202, known.statusCode());
        assertEquals(known.statusCode(), unknown.statusCode());
        assertEquals(known.body(), unknown.body());
        String oldToken = letters.get("reset@example.com").split("#resetToken=")[1];
        assertEquals(202, first.post("/password-reset/request", Map.of("email", "reset@example.com")).statusCode());
        String resetToken = letters.get("reset@example.com").split("#resetToken=")[1];
        var input = Map.of("token", resetToken, "password", "new correct horse battery staple");
        assertEquals(204, new Browser().post("/password-reset/complete", input).statusCode());
        assertEquals(400, new Browser().post("/password-reset/complete", input).statusCode());
        assertEquals(400, new Browser().post("/password-reset/complete",
                Map.of("token", oldToken, "password", "another sufficiently long password")).statusCode());
        assertEquals(401, first.request("GET", "/me", null, false).statusCode());
        assertEquals(401, second.request("GET", "/me", null, false).statusCode());
        assertEquals(401, new Browser().post("/login", credentials("reset@example.com")).statusCode());
        assertEquals(200, new Browser().post("/login",
                Map.of("email", "reset@example.com", "password", "new correct horse battery staple")).statusCode());
    }

    @Test
    void passwordChangeRejectsWrongPasswordWithoutRevokingSessions() throws Exception {
        Browser first = verifiedBrowser("change@example.com");
        Browser second = new Browser();
        assertEquals(200, second.post("/login", credentials("change@example.com")).statusCode());
        assertEquals(400, first.post("/password-change", Map.of(
                "currentPassword", "wrong", "password", "new correct horse battery staple")).statusCode());
        assertEquals(200, second.request("GET", "/me", null, false).statusCode());
        assertEquals(204, first.post("/password-change", Map.of(
                "currentPassword", "correct horse battery staple",
                "password", "new correct horse battery staple")).statusCode());
        assertEquals(401, first.request("GET", "/me", null, false).statusCode());
        assertEquals(401, second.request("GET", "/me", null, false).statusCode());
        assertEquals(200, new Browser().post("/login",
                Map.of("email", "change@example.com", "password", "new correct horse battery staple")).statusCode());
    }

    @Test
    void resetTokensExpireArePurposeBoundAndOnlyOneConcurrentRequestSucceeds() throws Exception {
        Browser browser = new Browser();
        browser.post("/register", credentials("race@example.com"));
        String confirmation = token("race@example.com");
        assertEquals(202, browser.post("/password-reset/request", Map.of("email", "race@example.com")).statusCode());
        String first = letters.get("race@example.com").split("#resetToken=")[1];
        assertNotEquals(first, jdbc.queryForObject("SELECT token_hash FROM app.password_reset_tokens", String.class));
        assertEquals(400, browser.post("/confirm", Map.of("token", first)).statusCode());
        assertEquals(400, browser.post("/password-reset/complete",
                Map.of("token", confirmation, "password", "another sufficiently long password")).statusCode());
        jdbc.update("UPDATE app.password_reset_tokens SET expires_at = now() - interval '1 second'");
        assertEquals(400, browser.post("/password-reset/complete",
                Map.of("token", first, "password", "another sufficiently long password")).statusCode());
        assertEquals(202, browser.post("/password-reset/request", Map.of("email", "race@example.com")).statusCode());
        String reset = letters.get("race@example.com").split("#resetToken=")[1];
        try (var pool = Executors.newFixedThreadPool(2)) {
            var one = pool.submit(() -> new Browser().post("/password-reset/complete",
                    Map.of("token", reset, "password", "another sufficiently long password")).statusCode());
            var two = pool.submit(() -> new Browser().post("/password-reset/complete",
                    Map.of("token", reset, "password", "another sufficiently long password")).statusCode());
            assertEquals(604, one.get() + two.get());
        }
        var unverified = new Browser().post("/login",
                Map.of("email", "race@example.com", "password", "another sufficiently long password"));
        assertEquals(401, unverified.statusCode());
        assertEquals("emailUnverified", json.readTree(unverified.body()).path("code").asText());
        assertEquals(204, browser.post("/confirm", Map.of("token", confirmation)).statusCode());
    }

    @Test
    void resetAndChangeRequireCsrfAndRateLimitRequests() throws Exception {
        Browser browser = new Browser();
        assertEquals(403, browser.request("POST", "/password-reset/request",
                Map.of("email", "missing@example.com"), false).statusCode());
        assertEquals(403, browser.request("POST", "/password-reset/complete",
                Map.of("token", "anything", "password", "a sufficiently long password"), false).statusCode());
        for (int attempt = 0; attempt < 3; attempt++) {
            assertEquals(202, browser.post("/password-reset/request", Map.of("email", "missing@example.com")).statusCode());
        }
        assertEquals(429, browser.post("/password-reset/request", Map.of("email", "missing@example.com")).statusCode());
        Browser loggedIn = verifiedBrowser("limit@example.com");
        assertEquals(403, loggedIn.request("POST", "/password-change",
                Map.of("currentPassword", "wrong", "password", "a sufficiently long password"), false).statusCode());
        for (int attempt = 0; attempt < 9; attempt++) {
            assertEquals(400, loggedIn.post("/password-change",
                    Map.of("currentPassword", "wrong", "password", "a sufficiently long password")).statusCode());
        }
        assertEquals(429, loggedIn.post("/password-change",
                Map.of("currentPassword", "wrong", "password", "a sufficiently long password")).statusCode());
        assertEquals(200, loggedIn.request("GET", "/me", null, false).statusCode());
    }

    @Test
    void changingPasswordInvalidatesOutstandingResetLinks() throws Exception {
        Browser browser = verifiedBrowser("old-link@example.com");
        assertEquals(202, browser.post("/password-reset/request", Map.of("email", "old-link@example.com")).statusCode());
        String oldToken = letters.get("old-link@example.com").split("#resetToken=")[1];
        assertEquals(204, browser.post("/password-change", Map.of(
                "currentPassword", "correct horse battery staple",
                "password", "new correct horse battery staple")).statusCode());
        assertEquals(400, new Browser().post("/password-reset/complete",
                Map.of("token", oldToken, "password", "another sufficiently long password")).statusCode());
        assertEquals(200, new Browser().post("/login",
                Map.of("email", "old-link@example.com", "password", "new correct horse battery staple")).statusCode());
    }

    @Test
    void resetFromAuthenticatedBrowserRevokesItsOwnSession() throws Exception {
        Browser browser = verifiedBrowser("own-reset@example.com");
        assertEquals(202, browser.post("/password-reset/request", Map.of("email", "own-reset@example.com")).statusCode());
        String reset = letters.get("own-reset@example.com").split("#resetToken=")[1];
        assertEquals(204, browser.post("/password-reset/complete",
                Map.of("token", reset, "password", "new correct horse battery staple")).statusCode());
        assertEquals(401, browser.request("GET", "/me", null, false).statusCode());
    }

    @Test
    void failureRevokingSessionsRollsBackPasswordAndResetTokens() throws Exception {
        Browser browser = verifiedBrowser("rollback@example.com");
        assertEquals(202, browser.post("/password-reset/request", Map.of("email", "rollback@example.com")).statusCode());
        String oldHash = jdbc.queryForObject("SELECT password_hash FROM app.accounts", String.class);
        jdbc.execute("""
                CREATE TABLE app.session_deletion_guard (
                    session_id char(36) REFERENCES app.spring_session(primary_id)
                )
                """);
        try {
            jdbc.update("""
                    INSERT INTO app.session_deletion_guard
                    SELECT primary_id FROM app.spring_session WHERE principal_name IS NOT NULL
                    """);
            assertEquals(500, browser.post("/password-change", Map.of(
                    "currentPassword", "correct horse battery staple",
                    "password", "new correct horse battery staple")).statusCode());
            assertEquals(oldHash, jdbc.queryForObject("SELECT password_hash FROM app.accounts", String.class));
            assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM app.password_reset_tokens", Integer.class));
            assertEquals(200, browser.request("GET", "/me", null, false).statusCode());
        } finally {
            jdbc.execute("DROP TABLE app.session_deletion_guard");
        }
    }

    static Browser verifiedBrowser(String email) throws Exception {
        Browser browser = new Browser();
        assertEquals(202, browser.post("/register", credentials(email)).statusCode());
        assertEquals(204, browser.post("/confirm", Map.of("token", token(email))).statusCode());
        assertEquals(200, browser.post("/login", credentials(email)).statusCode());
        return browser;
    }

    static Map<String, String> credentials(String email) {
        return Map.of("email", email, "password", "correct horse battery staple");
    }

    static String token(String email) {
        return letters.get(email).split("#token=")[1];
    }

    static class Browser {
        final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        final HttpClient http = HttpClient.newBuilder().cookieHandler(cookies)
                .connectTimeout(Duration.ofSeconds(10)).build();

        JsonNode get(String path) throws Exception {
            var response = request("GET", path, null, false);
            assertEquals(200, response.statusCode());
            return json.readTree(response.body());
        }

        HttpResponse<String> post(String path, Object body) throws Exception {
            return request("POST", path, body, true);
        }

        HttpResponse<String> delete(String path) throws Exception {
            return request("DELETE", path, null, true);
        }

        HttpResponse<String> characterRequest(String method, String path, Object body, String ifMatch,
                                              boolean csrf) throws Exception {
            var request = HttpRequest.newBuilder(URI.create(base + "/api/characters" + path))
                    .timeout(Duration.ofSeconds(20)).header("Content-Type", "application/json");
            if (ifMatch != null) {
                request.header("If-Match", ifMatch);
            }
            if (csrf) {
                request.header("X-CSRF-TOKEN", get("/csrf").path("token").asText());
            }
            String payload = body == null ? null
                    : body instanceof String raw ? raw : json.writeValueAsString(body);
            return http.send(request.method(method, payload == null ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(payload)).build(), HttpResponse.BodyHandlers.ofString());
        }

        HttpResponse<String> request(String method, String path, Object body, boolean csrf) throws Exception {
            var request = HttpRequest.newBuilder(URI.create(base + "/api/auth" + path))
                    .timeout(Duration.ofSeconds(20)).header("Content-Type", "application/json")
                    .header("X-Forwarded-For", "203.0.113." + (System.nanoTime() % 250));
            if (csrf) {
                request.header("X-CSRF-TOKEN", get("/csrf").path("token").asText());
            }
            return http.send(request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),
                    HttpResponse.BodyHandlers.ofString());
        }

        String sessionCookie() {
            return cookies.getCookieStore().getCookies().stream()
                    .filter(cookie -> cookie.getName().equals("SESSION"))
                    .findFirst().orElseThrow().getValue();
        }
    }
}
