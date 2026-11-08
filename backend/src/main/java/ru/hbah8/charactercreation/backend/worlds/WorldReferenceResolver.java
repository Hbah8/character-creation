package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;

/** Validates character links against the authenticated account's current world context. */
public interface WorldReferenceResolver {
    /** Rejects a character whose world or world-scoped catalog references cannot be resolved. */
    void validateCharacter(UUID ownerId, JsonNode character);
}
