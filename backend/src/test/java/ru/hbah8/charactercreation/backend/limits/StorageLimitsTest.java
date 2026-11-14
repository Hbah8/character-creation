package ru.hbah8.charactercreation.backend.limits;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import ru.hbah8.charactercreation.backend.identity.IdentityProperties;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class StorageLimitsTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(Properties.class);

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties({StorageLimits.class, IdentityProperties.class})
    static class Properties {
    }

    @Test
    void defaultsAndOverridesAreBoundBeforeServingRequests() {
        context.run(app -> {
            assertNull(app.getStartupFailure());
            StorageLimits limits = app.getBean(StorageLimits.class);
            assertAll(
                    () -> assertEquals(3, limits.worldsPerAccount()),
                    () -> assertEquals(50, limits.charactersPerWorld()),
                    () -> assertEquals(50, limits.standaloneCharacters()),
                    () -> assertEquals(500, limits.entitiesPerWorld()),
                    () -> assertEquals(1000, limits.relationshipsPerWorld()),
                    () -> assertEquals(50, limits.racesPerWorld()),
                    () -> assertEquals(500, limits.handbookEntriesPerWorld()),
                    () -> assertEquals(262144, limits.characterRequestBytes()),
                    () -> assertEquals(2097152, limits.worldRequestBytes()),
                    () -> assertEquals(true, app.getBean(IdentityProperties.class).registrationEnabled())
            );
        });
        context.withPropertyValues("app.storage-limits.worlds-per-account=0",
                "app.storage-limits.characters-per-world=7",
                "app.identity.registration-enabled=false").run(app -> {
            assertNull(app.getStartupFailure());
            assertAll(
                    () -> assertEquals(0, app.getBean(StorageLimits.class).worldsPerAccount()),
                    () -> assertEquals(7, app.getBean(StorageLimits.class).charactersPerWorld()),
                    () -> assertEquals(false, app.getBean(IdentityProperties.class).registrationEnabled())
            );
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "app.storage-limits.worlds-per-account=-1",
            "app.storage-limits.characters-per-world=-1",
            "app.storage-limits.standalone-characters=-1",
            "app.storage-limits.entities-per-world=-1",
            "app.storage-limits.relationships-per-world=-1",
            "app.storage-limits.races-per-world=-1",
            "app.storage-limits.handbook-entries-per-world=-1",
            "app.storage-limits.character-request-bytes=0",
            "app.storage-limits.world-request-bytes=-1",
            "app.storage-limits.worlds-per-account=unlimited",
            "app.storage-limits.worlds-per-account=",
            "app.storage-limits.characters-per-world=1.5",
            "app.storage-limits.character-request-bytes=2147483647",
            "app.identity.registration-enabled=not-a-boolean",
            "app.identity.registration-enabled="
    })
    void invalidConfigurationPreventsStartup(String property) {
        context.withPropertyValues(property).run(app -> assertNotNull(app.getStartupFailure(), property));
    }
}
