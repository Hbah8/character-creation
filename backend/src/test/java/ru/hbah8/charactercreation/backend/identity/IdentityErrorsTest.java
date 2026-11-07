package ru.hbah8.charactercreation.backend.identity;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationServiceException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Authentication infrastructure failures must not be reported as invalid passwords. */
class IdentityErrorsTest {
    @Test
    void authenticationServiceFailureReturnsUnavailable() {
        var response = new IdentityErrors().authentication(new AuthenticationServiceException("internal failure"));
        assertEquals(503, response.getStatusCode().value());
        assertEquals(Map.of("code", "unavailable"), response.getBody());
    }
}
