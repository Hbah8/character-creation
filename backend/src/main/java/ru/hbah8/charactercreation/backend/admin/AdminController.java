package ru.hbah8.charactercreation.backend.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Server-authorized HTTP boundary for account administration. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService administration;

    public AdminController(AdminService administration) {
        this.administration = administration;
    }

    @GetMapping("/accounts")
    public ResponseEntity<AdminService.AccountPage> accounts(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(administration.accounts(query.strip(), status, page, size));
    }

    @PostMapping("/accounts/{id}/approve")
    public ResponseEntity<Void> approve(Authentication authentication, @PathVariable UUID id) {
        administration.approve(actor(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{id}/block")
    public ResponseEntity<Void> block(Authentication authentication, @PathVariable UUID id) {
        administration.block(actor(authentication), id, true);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{id}/unblock")
    public ResponseEntity<Void> unblock(Authentication authentication, @PathVariable UUID id) {
        administration.block(actor(authentication), id, false);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        administration.delete(actor(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit")
    public ResponseEntity<AdminService.AuditPage> audit(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(administration.audit(page, size));
    }

    private static UUID actor(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
