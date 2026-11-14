package ru.hbah8.charactercreation.backend.limits;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import ru.hbah8.charactercreation.backend.characters.CharacterException;
import ru.hbah8.charactercreation.backend.characters.CharacterRepository;
import ru.hbah8.charactercreation.backend.identity.AccountRepository;
import ru.hbah8.charactercreation.backend.worlds.WorldException;
import ru.hbah8.charactercreation.backend.worlds.WorldRepository;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccountQuotaServiceTest {
    @ParameterizedTest
    @ValueSource(longs = {1, 2, 3})
    void configuredQuotaBlocksAtAndAboveMaximumButNotBelow(long count) {
        UUID account = UUID.randomUUID();
        UUID world = UUID.randomUUID();
        var worlds = mock(WorldRepository.class);
        var characters = mock(CharacterRepository.class);
        var limits = new StorageLimits(2, 2, 2, 500, 1000, 50, 500, 262144, 2097152);
        var quota = new AccountQuotaService(mock(AccountRepository.class), worlds, characters, limits);
        when(worlds.count(account)).thenReturn(count);
        when(characters.count(account, world)).thenReturn(count);
        when(characters.count(account, null)).thenReturn(count);
        if (count < 2) {
            assertDoesNotThrow(() -> quota.requireWorldCapacity(account));
            assertDoesNotThrow(() -> quota.requireCharacterCapacity(account, world));
            assertDoesNotThrow(() -> quota.requireCharacterCapacity(account, null));
        } else {
            assertEquals("worldLimitReached", assertThrowsExactly(WorldException.class,
                    () -> quota.requireWorldCapacity(account)).code());
            assertEquals("worldCharacterLimitReached", assertThrowsExactly(CharacterException.class,
                    () -> quota.requireCharacterCapacity(account, world)).code());
            assertEquals("standaloneCharacterLimitReached", assertThrowsExactly(CharacterException.class,
                    () -> quota.requireCharacterCapacity(account, null)).code());
        }
    }
}
