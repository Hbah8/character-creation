package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** A persisted world aggregate and its optimistic-locking metadata. */
public record SavedWorld(UUID id, long version, Instant createdAt, Instant updatedAt, JsonNode world) {
}
