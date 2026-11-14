package ru.hbah8.charactercreation.backend.identity;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

/** Stable errors that never serialize rejected passwords or tokens. */
@RestControllerAdvice(assignableTypes = IdentityController.class)
public class IdentityErrors {
    private static final Logger logger = LoggerFactory.getLogger(IdentityErrors.class);

    @ExceptionHandler(IdentityException.class)
    public ResponseEntity<Map<String, String>> identity(IdentityException exception) {
        var response = ResponseEntity.status(exception.status());
        if (exception.status() == 429) {
            response.header("Retry-After", "900");
        }
        return response.body(Map.of("code", exception.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> authentication(AuthenticationException exception) {
        if (exception instanceof AuthenticationServiceException) {
            logger.error("Account authentication service failed");
            return ResponseEntity.status(503).body(Map.of("code", "unavailable"));
        }
        return ResponseEntity.status(401).body(Map.of("code",
                exception instanceof DisabledException && "accountBlocked".equals(exception.getMessage())
                        ? "accountBlocked" : exception instanceof DisabledException ? "emailUnverified" : "invalidCredentials"));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> validation() {
        return ResponseEntity.badRequest().body(Map.of("code", "invalidInput"));
    }
}
