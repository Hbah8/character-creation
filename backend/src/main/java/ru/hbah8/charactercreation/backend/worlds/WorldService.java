package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Account-scoped world operations, reference integrity, and optimistic locking. */
@Service
public class WorldService implements WorldReferenceResolver {
    private final WorldRepository worlds;
    private final WorldValidator validator;
    private final WorldCharacterReferences characters;

    /**
     * Creates the world application service.
     *
     * @param worlds world repository
     * @param validator world and link validator
     * @param characters linked-character lookup
     */
    public WorldService(WorldRepository worlds, WorldValidator validator, WorldCharacterReferences characters) {
        this.worlds = worlds;
        this.validator = validator;
        this.characters = characters;
    }

    /** Lists only worlds belonging to the authenticated account. */
    @Transactional(readOnly = true)
    public List<SavedWorld> list(UUID ownerId) {
        return worlds.list(ownerId);
    }

    /** Reads one world only when it belongs to the authenticated account. */
    @Transactional(readOnly = true)
    public SavedWorld get(UUID ownerId, UUID id) {
        return worlds.find(ownerId, id).orElseThrow(WorldService::notFound);
    }

    /** Creates a world and all of its graph, race, and handbook records atomically. */
    @Transactional
    public SavedWorld create(UUID ownerId, JsonNode input) {
        ObjectNode world = validator.validate(input);
        return worlds.insert(ownerId, UUID.randomUUID(), world);
    }

    /** Replaces a world only at its current version and preserves all linked character references. */
    @Transactional
    public SavedWorld update(UUID ownerId, UUID id, long expectedVersion, JsonNode input) {
        ObjectNode world = validator.validate(input);
        SavedWorld updated = worlds.updateRoot(ownerId, id, expectedVersion, world)
                .orElseThrow(() -> currentOrNotFound(ownerId, id));
        try {
            for (JsonNode character : characters.findByWorld(ownerId, id)) {
                validator.validateCharacterReferences(character, world);
            }
        } catch (WorldException exception) {
            if ("invalidReference".equals(exception.code())) {
                throw new WorldException(409, "referencedResource");
            }
            throw exception;
        }
        return updated;
    }

    /** Deletes a world only at its current version and never cascades to its characters. */
    @Transactional
    public void delete(UUID ownerId, UUID id, long expectedVersion) {
        requireOwned(ownerId, id);
        if (characters.hasCharacters(ownerId, id)) {
            throw new WorldException(409, "referencedResource");
        }
        try {
            if (worlds.delete(ownerId, id, expectedVersion)) {
                return;
            }
        } catch (DataIntegrityViolationException exception) {
            throw new WorldException(409, "referencedResource");
        }
        throw currentOrNotFound(ownerId, id);
    }

    /** Validates a linked character under the world row lock to serialize concurrent edits. */
    @Override
    @Transactional
    public void validateCharacter(UUID ownerId, JsonNode character) {
        JsonNode worldId = character.get("worldId");
        if (worldId == null || worldId.isNull() || worldId.isTextual() && worldId.asText().isBlank()) {
            return;
        }
        if (!worldId.isTextual()) {
            throw new WorldException(400, "invalidReference");
        }
        UUID id;
        try {
            id = UUID.fromString(worldId.asText());
        } catch (IllegalArgumentException exception) {
            throw new WorldException(400, "invalidReference");
        }
        WorldRepository.WorldRoot root = worlds.findRootForUpdate(ownerId, id)
                .orElseThrow(() -> new WorldException(400, "invalidReference"));
        SavedWorld world = worlds.readForUpdate(root);
        validator.validateCharacterReferences(character, world.world());
    }

    private void requireOwned(UUID ownerId, UUID id) {
        if (worlds.findRoot(ownerId, id).isEmpty()) {
            throw notFound();
        }
    }

    private WorldException currentOrNotFound(UUID ownerId, UUID id) {
        if (worlds.findRoot(ownerId, id).isEmpty()) {
            return notFound();
        }
        return new WorldException(409, "conflict");
    }

    private static WorldException notFound() {
        return new WorldException(404, "notFound");
    }
}
