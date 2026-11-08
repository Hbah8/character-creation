package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.UUID;

/** Reads linked character payloads without making the worlds module own character persistence. */
public interface WorldCharacterReferences {
    /** Returns the current account's character payloads linked to a world. */
    List<JsonNode> findByWorld(UUID ownerId, UUID worldId);

    /** Returns whether the current account has a character linked to a world. */
    boolean hasCharacters(UUID ownerId, UUID worldId);
}
