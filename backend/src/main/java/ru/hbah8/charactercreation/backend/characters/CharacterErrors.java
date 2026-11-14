package ru.hbah8.charactercreation.backend.characters;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import ru.hbah8.charactercreation.backend.worlds.WorldException;
import ru.hbah8.charactercreation.backend.identity.IdentityException;

import java.util.Map;

/** Stable, non-disclosing error responses for character API requests. */
@RestControllerAdvice(assignableTypes = CharacterController.class)
public class CharacterErrors {
    /** Converts expected character failures to their public API shape. */
    @ExceptionHandler(CharacterException.class)
    public ResponseEntity<Map<String, String>> character(CharacterException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.code()));
    }

    /** Converts invalid world links into stable character API failures. */
    @ExceptionHandler(WorldException.class)
    public ResponseEntity<Map<String, String>> world(WorldException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.code()));
    }

    /** Converts account access failures to a stable character API response. */
    @ExceptionHandler(IdentityException.class)
    public ResponseEntity<Map<String, String>> identity(IdentityException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.getMessage()));
    }

    /** Converts invalid request JSON, DTOs, and IDs into a stable client error. */
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> validation() {
        return ResponseEntity.badRequest().body(Map.of("code", "invalidCharacter"));
    }
}
