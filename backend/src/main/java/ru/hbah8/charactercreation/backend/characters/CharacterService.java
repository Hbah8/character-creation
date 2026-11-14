package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.hbah8.charactercreation.backend.limits.AccountQuotaService;
import ru.hbah8.charactercreation.backend.identity.AccountAccessService;
import ru.hbah8.charactercreation.backend.worlds.WorldReferenceResolver;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** Account-scoped character operations and optimistic-locking policy. */
@Service
public class CharacterService {
    private final CharacterRepository characters;
    private final CharacterValidator validator;
    private final WorldReferenceResolver worldReferences;
    private final AccountQuotaService quotas;
    private final AccountAccessService access;

    /**
     * Creates the character application service.
     *
     * @param characters character repository
     * @param validator payload validator
     * @param worldReferences world ownership and link validator
     * @param quotas transactional account capacity policy
     */
    public CharacterService(CharacterRepository characters, CharacterValidator validator,
                            WorldReferenceResolver worldReferences, AccountQuotaService quotas, AccountAccessService access) {
        this.characters = characters;
        this.validator = validator;
        this.worldReferences = worldReferences;
        this.quotas = quotas;
        this.access = access;
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
        access.requireApproved(ownerId);
        validator.validate(character);
        quotas.lockAccount(ownerId);
        worldReferences.validateCharacter(ownerId, character);
        quotas.requireCharacterCapacity(ownerId, CharacterRepository.worldId(character));
        return characters.insert(ownerId, UUID.randomUUID(), character);
    }

    /** Updates a character only if the supplied version is still current. */
    @Transactional
    public SavedCharacter update(UUID ownerId, UUID id, long expectedVersion, JsonNode character) {
        access.requireApproved(ownerId);
        quotas.lockAccount(ownerId);
        SavedCharacter current = get(ownerId, id);
        if (current.version() != expectedVersion) {
            throw new CharacterException(409, "conflict");
        }
        validator.validate(character);
        worldReferences.validateCharacter(ownerId, character);
        UUID destination = CharacterRepository.worldId(character);
        if (!Objects.equals(CharacterRepository.worldId(current.character()), destination)) {
            quotas.requireCharacterCapacity(ownerId, destination);
        }
        return characters.update(ownerId, id, expectedVersion, character)
                .orElseThrow(() -> currentOrNotFound(ownerId, id));
    }

    /** Deletes a character only if the supplied version is still current. */
    @Transactional
    public void delete(UUID ownerId, UUID id, long expectedVersion) {
        access.requireApproved(ownerId);
        quotas.lockAccount(ownerId);
        if (characters.delete(ownerId, id, expectedVersion)) {
            return;
        }
        throw currentOrNotFound(ownerId, id);
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
