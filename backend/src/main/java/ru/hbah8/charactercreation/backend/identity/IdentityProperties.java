package ru.hbah8.charactercreation.backend.identity;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

/** Runtime settings for account verification; no credentials belong here. */
@Validated
@ConfigurationProperties("app.identity")
public record IdentityProperties(
        @NotNull @DefaultValue("http://localhost:5173") URI publicBaseUrl,
        @NotNull @DefaultValue("PT24H") Duration verificationTtl,
        @NotNull Boolean registrationEnabled,
        @DefaultValue List<@NotNull UUID> adminAccountIds,
        @NotNull @DefaultValue("PT24H") Duration pendingAccountTtl) {
    /** @return whether the configured verification lifetime is bounded and positive */
    @AssertTrue
    public boolean isLifetimeValid() {
        return verificationTtl != null && !verificationTtl.isNegative() && !verificationTtl.isZero()
                && verificationTtl.compareTo(Duration.ofDays(7)) <= 0;
    }

    /** @return whether links use a concrete HTTP origin and no query or fragment */
    @AssertTrue
    public boolean isBaseUrlValid() {
        return publicBaseUrl != null && publicBaseUrl.getHost() != null
                && ("https".equals(publicBaseUrl.getScheme()) || "http".equals(publicBaseUrl.getScheme()))
                && publicBaseUrl.getRawQuery() == null && publicBaseUrl.getRawFragment() == null
                && publicBaseUrl.getUserInfo() == null;
    }

    /** @return whether pending accounts have a bounded positive lifetime */
    @AssertTrue
    public boolean isPendingAccountLifetimeValid() {
        return pendingAccountTtl != null && !pendingAccountTtl.isNegative() && !pendingAccountTtl.isZero()
                && pendingAccountTtl.compareTo(Duration.ofDays(7)) <= 0;
    }
}
