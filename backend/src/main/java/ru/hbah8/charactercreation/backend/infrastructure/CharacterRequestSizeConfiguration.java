package ru.hbah8.charactercreation.backend.infrastructure;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import ru.hbah8.charactercreation.backend.characters.CharacterRequestSizeFilter;
import ru.hbah8.charactercreation.backend.limits.StorageLimits;

/** Registers the bounded JSON request filter after Spring Security. */
@Configuration
@EnableConfigurationProperties(StorageLimits.class)
public class CharacterRequestSizeConfiguration {
    @Bean
    FilterRegistrationBean<CharacterRequestSizeFilter> characterRequestSizeFilter(StorageLimits limits) {
        var registration = new FilterRegistrationBean<>(new CharacterRequestSizeFilter(limits));
        registration.addUrlPatterns("/api/characters", "/api/characters/*", "/api/worlds", "/api/worlds/*");
        registration.setOrder(Ordered.LOWEST_PRECEDENCE);
        return registration;
    }
}
