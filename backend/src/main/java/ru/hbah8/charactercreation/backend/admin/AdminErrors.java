package ru.hbah8.charactercreation.backend.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

/** Stable error responses for the administrator-only API. */
@RestControllerAdvice(assignableTypes = AdminController.class)
public class AdminErrors {
    @ExceptionHandler(AdminException.class)
    public ResponseEntity<Map<String, String>> administration(AdminException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("code", exception.code()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> validation() {
        return ResponseEntity.badRequest().body(Map.of("code", "invalidInput"));
    }
}
