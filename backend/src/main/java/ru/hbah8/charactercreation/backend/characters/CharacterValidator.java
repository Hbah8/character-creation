package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Validates the stable character JSON contract without rewriting user data. */
@Component
public class CharacterValidator {
    private static final Set<String> RANKS = Set.of("Novice", "Seasoned", "Veteran", "Heroic", "Legendary");
    private static final Set<String> DICE = Set.of("", "d4", "d6", "d8", "d10", "d12", "d12+1", "d12+2");
    private static final List<String> REQUIRED_TEXT_FIELDS = List.of(
            "sheetTitle", "callsign", "name", "rank", "role", "fileNo", "portraitUrl", "notes",
            "agility", "strength", "smarts", "spirit", "vigor");
    private static final List<String> REQUIRED_ARRAY_FIELDS = List.of(
            "skills", "edges", "hindrances", "weapons", "gear", "specialRules");

    /** Validates an incoming JSON character while preserving all accepted fields. */
    public void validate(JsonNode character) {
        if (character == null || !character.isObject()) {
            throw invalidCharacter();
        }

        for (String field : REQUIRED_TEXT_FIELDS) {
            JsonNode value = character.get(field);
            if (value == null || !value.isTextual() || value.textValue().length() > 100_000) {
                throw invalidCharacter();
            }
        }
        if (!RANKS.contains(character.path("rank").textValue())
                || !character.path("isWildCard").isBoolean()) {
            throw invalidCharacter();
        }
        for (String field : List.of("agility", "strength", "smarts", "spirit", "vigor")) {
            if (!DICE.contains(character.path(field).textValue())) {
                throw invalidCharacter();
            }
        }
        for (String field : REQUIRED_ARRAY_FIELDS) {
            if (!character.path(field).isArray()) {
                throw invalidCharacter();
            }
        }
        if (character.has("powers") && !character.path("powers").isArray()) {
            throw invalidCharacter();
        }
        JsonNode worldId = character.get("worldId");
        if (worldId != null && !worldId.isNull() && !worldId.asText().isBlank()) {
            if (!worldId.isTextual()) {
                throw invalidCharacter();
            }
            try {
                UUID.fromString(worldId.textValue());
            } catch (IllegalArgumentException exception) {
                throw invalidCharacter();
            }
        }
        JsonNode raceId = character.get("raceId");
        if (raceId != null && !raceId.isNull() && !raceId.isTextual()) {
            throw invalidCharacter();
        }
        if (!character.path("portraitUrl").textValue().isBlank()) {
            throw new CharacterException(400, "unsupportedData");
        }
    }

    private CharacterException invalidCharacter() {
        return new CharacterException(400, "invalidCharacter");
    }
}
