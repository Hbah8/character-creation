package ru.hbah8.charactercreation.backend.limits;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ru.hbah8.charactercreation.backend.characters.CharacterException;
import ru.hbah8.charactercreation.backend.characters.CharacterRepository;
import ru.hbah8.charactercreation.backend.identity.AccountRepository;
import ru.hbah8.charactercreation.backend.worlds.WorldException;
import ru.hbah8.charactercreation.backend.worlds.WorldRepository;

import java.util.UUID;

/** Single account-quota policy boundary; a future plan resolver can replace the configuration source here. */
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class AccountQuotaService {
    private final AccountRepository accounts;
    private final WorldRepository worlds;
    private final CharacterRepository characters;
    private final StorageLimits limits;

    /**
     * Creates the shared quota policy.
     *
     * @param accounts account lock repository
     * @param worlds world counts
     * @param characters character counts by destination
     * @param limits configured capacities
     */
    public AccountQuotaService(AccountRepository accounts, WorldRepository worlds,
                               CharacterRepository characters, StorageLimits limits) {
        this.accounts = accounts;
        this.worlds = worlds;
        this.characters = characters;
        this.limits = limits;
    }

    /**
     * Serializes writes across backend instances until the caller's transaction ends.
     * Acquire this lock before world or character locks.
     *
     * @param ownerId authenticated account
     */
    public void lockAccount(UUID ownerId) {
        accounts.lock(ownerId);
    }

    /**
     * Locks the account and checks capacity before inserting a world in the same transaction.
     *
     * @param ownerId authenticated account
     */
    public void requireWorldCapacity(UUID ownerId) {
        lockAccount(ownerId);
        if (worlds.count(ownerId) >= limits.worldsPerAccount()) {
            throw new WorldException(409, "worldLimitReached");
        }
    }

    /**
     * Locks the account and checks the destination before a character insertion or move.
     *
     * @param ownerId authenticated account
     * @param worldId destination world, or null for standalone characters
     */
    public void requireCharacterCapacity(UUID ownerId, UUID worldId) {
        lockAccount(ownerId);
        int maximum = worldId == null ? limits.standaloneCharacters() : limits.charactersPerWorld();
        if (characters.count(ownerId, worldId) >= maximum) {
            throw new CharacterException(409,
                    worldId == null ? "standaloneCharacterLimitReached" : "worldCharacterLimitReached");
        }
    }
}
