package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** A stored standalone character and its optimistic-locking metadata. */
public record SavedCharacter(UUID id, long version, Instant createdAt, Instant updatedAt, JsonNode character) {
}
