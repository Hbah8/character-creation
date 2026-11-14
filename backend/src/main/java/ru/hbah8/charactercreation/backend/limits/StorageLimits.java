package ru.hbah8.charactercreation.backend.limits;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Validated storage ceilings; zero collection capacity disables new entries, never removes data. */
@Validated
@ConfigurationProperties("app.storage-limits")
public record StorageLimits(
        @NotNull @Min(0) Integer worldsPerAccount,
        @NotNull @Min(0) Integer charactersPerWorld,
        @NotNull @Min(0) Integer standaloneCharacters,
        @NotNull @Min(0) Integer entitiesPerWorld,
        @NotNull @Min(0) Integer relationshipsPerWorld,
        @NotNull @Min(0) Integer racesPerWorld,
        @NotNull @Min(0) Integer handbookEntriesPerWorld,
        @NotNull @Min(1) @Max(2147483646) Integer characterRequestBytes,
        @NotNull @Min(1) @Max(2147483646) Integer worldRequestBytes) {
}
