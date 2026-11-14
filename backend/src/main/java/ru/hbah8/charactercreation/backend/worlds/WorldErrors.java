package ru.hbah8.charactercreation.backend.worlds;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import ru.hbah8.charactercreation.backend.identity.IdentityException;

import java.util.Map;

/** Stable, non-disclosing error responses for world API requests. */
@RestControllerAdvice(assignableTypes = WorldController.class)
public class WorldErrors {
    /** Converts expected world failures to their public API shape. */
    @ExceptionHandler(WorldException.class)
    public ResponseEntity<Map<String, String>> world(WorldException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.code()));
    }

    /** Converts account access failures to a stable world API response. */
    @ExceptionHandler(IdentityException.class)
    public ResponseEntity<Map<String, String>> identity(IdentityException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.getMessage()));
    }

    /** Converts malformed JSON, DTOs, and IDs into a stable client error. */
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> validation() {
        return ResponseEntity.badRequest().body(Map.of("code", "invalidWorld"));
    }
}
