package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.hbah8.charactercreation.backend.worlds.WorldReferenceResolver;

import java.util.List;
import java.util.UUID;

/** Account-scoped character operations and optimistic-locking policy. */
@Service
public class CharacterService {
    private final CharacterRepository characters;
    private final CharacterValidator validator;
    private final WorldReferenceResolver worldReferences;

    /**
     * Creates the character application service.
     *
     * @param characters character repository
     * @param validator payload validator
     * @param worldReferences world ownership and link validator
     */
    public CharacterService(CharacterRepository characters, CharacterValidator validator,
                            WorldReferenceResolver worldReferences) {
        this.characters = characters;
        this.validator = validator;
        this.worldReferences = worldReferences;
    }

    /** Lists characters belonging only to the authenticated account. */
    @Transactional(readOnly = true)
    public List<SavedCharacter> list(UUID ownerId) {
        return characters.list(ownerId);
    }

    /** Loads a character only when it belongs to the authenticated account. */
    @Transactional(readOnly = true)
    public SavedCharacter get(UUID ownerId, UUID id) {
        return characters.find(ownerId, id).orElseThrow(CharacterService::notFound);
    }

    /** Creates a character owned by the authenticated account. */
    @Transactional
    public SavedCharacter create(UUID ownerId, JsonNode character) {
        validator.validate(character);
        worldReferences.validateCharacter(ownerId, character);
        return characters.insert(ownerId, UUID.randomUUID(), character);
    }

    /** Updates a character only if the supplied version is still current. */
    @Transactional
    public SavedCharacter update(UUID ownerId, UUID id, long expectedVersion, JsonNode character) {
        requireOwned(ownerId, id);
        validator.validate(character);
        worldReferences.validateCharacter(ownerId, character);
        return characters.update(ownerId, id, expectedVersion, character)
                .orElseThrow(() -> currentOrNotFound(ownerId, id));
    }

    /** Deletes a character only if the supplied version is still current. */
    @Transactional
    public void delete(UUID ownerId, UUID id, long expectedVersion) {
        if (characters.delete(ownerId, id, expectedVersion)) {
            return;
        }
        throw currentOrNotFound(ownerId, id);
    }

    private void requireOwned(UUID ownerId, UUID id) {
        if (characters.find(ownerId, id).isEmpty()) {
            throw notFound();
        }
    }

    private CharacterException currentOrNotFound(UUID ownerId, UUID id) {
        if (characters.find(ownerId, id).isEmpty()) {
            return notFound();
        }
        return new CharacterException(409, "conflict");
    }

    private static CharacterException notFound() {
        return new CharacterException(404, "notFound");
    }
}
