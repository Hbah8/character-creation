package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Authenticated HTTP boundary for account-owned saved characters. */
@RestController
@RequestMapping("/api/characters")
public class CharacterController {
    private static final Pattern ETAG_VERSION = Pattern.compile("\"([1-9][0-9]*)\"");
    private final CharacterService characters;

    /**
     * Creates the controller.
     *
     * @param characters account-scoped character service
     */
    public CharacterController(CharacterService characters) {
        this.characters = characters;
    }

    /** Lists the current account's saved characters without shared caching. */
    @GetMapping
    public ResponseEntity<List<CharacterResponse>> list(Authentication authentication) {
        var records = characters.list(accountId(authentication)).stream().map(CharacterResponse::from).toList();
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(records);
    }

    /** Creates a saved character owned by the current account. */
    @PostMapping
    public ResponseEntity<CharacterResponse> create(Authentication authentication,
                                                     @Valid @RequestBody CharacterWrite input) {
        SavedCharacter created = characters.create(accountId(authentication), input.character());
        return ResponseEntity.created(URI.create("/api/characters/" + created.id()))
                .header(HttpHeaders.ETAG, etag(created.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(CharacterResponse.from(created));
    }

    /** Reads one saved character after checking account ownership. */
    @GetMapping("/{id}")
    public ResponseEntity<CharacterResponse> get(Authentication authentication, @PathVariable UUID id) {
        SavedCharacter record = characters.get(accountId(authentication), id);
        return ResponseEntity.ok().header(HttpHeaders.ETAG, etag(record.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(CharacterResponse.from(record));
    }

    /** Updates one character only when its If-Match version is current. */
    @PutMapping("/{id}")
    public ResponseEntity<CharacterResponse> update(Authentication authentication, @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody CharacterWrite input) {
        SavedCharacter updated = characters.update(accountId(authentication), id, version(ifMatch), input.character());
        return ResponseEntity.ok().header(HttpHeaders.ETAG, etag(updated.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(CharacterResponse.from(updated));
    }

    /** Deletes one character only when its If-Match version is current. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        characters.delete(accountId(authentication), id, version(ifMatch));
        return ResponseEntity.noContent().build();
    }

    private static UUID accountId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    private static long version(String ifMatch) {
        if (ifMatch == null) {
            throw new CharacterException(428, "preconditionRequired");
        }
        Matcher matcher = ETAG_VERSION.matcher(ifMatch);
        if (!matcher.matches()) {
            throw new CharacterException(400, "invalidVersion");
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException exception) {
            throw new CharacterException(400, "invalidVersion");
        }
    }

    private static String etag(long version) {
        return "\"" + version + "\"";
    }

    record CharacterWrite(@NotNull JsonNode character) {
    }

    public record CharacterResponse(UUID id, long version, Instant createdAt, Instant updatedAt, JsonNode character) {
        static CharacterResponse from(SavedCharacter record) {
            return new CharacterResponse(record.id(), record.version(), record.createdAt(), record.updatedAt(),
                    record.character());
        }
    }
}
