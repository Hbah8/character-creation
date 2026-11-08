package ru.hbah8.charactercreation.backend.worlds;

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

/** Authenticated HTTP boundary for account-owned worlds. */
@RestController
@RequestMapping("/api/worlds")
public class WorldController {
    private static final Pattern ETAG_VERSION = Pattern.compile("\"([1-9][0-9]*)\"");
    private final WorldService worlds;

    /**
     * Creates the controller.
     *
     * @param worlds account-scoped world service
     */
    public WorldController(WorldService worlds) {
        this.worlds = worlds;
    }

    /** Lists the current account's worlds without shared caching. */
    @GetMapping
    public ResponseEntity<List<WorldResponse>> list(Authentication authentication) {
        List<WorldResponse> records = worlds.list(accountId(authentication)).stream()
                .map(WorldResponse::from).toList();
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(records);
    }

    /** Creates a world owned by the authenticated account. */
    @PostMapping
    public ResponseEntity<WorldResponse> create(Authentication authentication,
                                                @Valid @RequestBody WorldWrite input) {
        SavedWorld created = worlds.create(accountId(authentication), input.world());
        return ResponseEntity.created(URI.create("/api/worlds/" + created.id()))
                .header(HttpHeaders.ETAG, etag(created.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(WorldResponse.from(created));
    }

    /** Reads one world after checking account ownership. */
    @GetMapping("/{id}")
    public ResponseEntity<WorldResponse> get(Authentication authentication, @PathVariable UUID id) {
        SavedWorld world = worlds.get(accountId(authentication), id);
        return ResponseEntity.ok().header(HttpHeaders.ETAG, etag(world.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(WorldResponse.from(world));
    }

    /** Updates one world only when its If-Match version is current. */
    @PutMapping("/{id}")
    public ResponseEntity<WorldResponse> update(Authentication authentication, @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody WorldWrite input) {
        SavedWorld updated = worlds.update(accountId(authentication), id, version(ifMatch), input.world());
        return ResponseEntity.ok().header(HttpHeaders.ETAG, etag(updated.version()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(WorldResponse.from(updated));
    }

    /** Deletes one world only when its If-Match version is current. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        worlds.delete(accountId(authentication), id, version(ifMatch));
        return ResponseEntity.noContent().build();
    }

    private static UUID accountId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    private static long version(String ifMatch) {
        if (ifMatch == null) {
            throw new WorldException(428, "preconditionRequired");
        }
        Matcher matcher = ETAG_VERSION.matcher(ifMatch);
        if (!matcher.matches()) {
            throw new WorldException(400, "invalidVersion");
        }
        try {
            return Long.parseLong(matcher.group(1));
        } catch (NumberFormatException exception) {
            throw new WorldException(400, "invalidVersion");
        }
    }

    private static String etag(long version) {
        return "\"" + version + "\"";
    }

    record WorldWrite(@NotNull JsonNode world) {
    }

    public record WorldResponse(UUID id, long version, Instant createdAt, Instant updatedAt, JsonNode world) {
        static WorldResponse from(SavedWorld record) {
            return new WorldResponse(record.id(), record.version(), record.createdAt(), record.updatedAt(),
                    record.world());
        }
    }
}
