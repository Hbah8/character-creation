package ru.hbah8.charactercreation.backend.infrastructure;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import ru.hbah8.charactercreation.backend.characters.CharacterRequestSizeFilter;

/** Registers the bounded JSON request filter after Spring Security. */
@Configuration
public class CharacterRequestSizeConfiguration {
    @Bean
    FilterRegistrationBean<CharacterRequestSizeFilter> characterRequestSizeFilter() {
        var registration = new FilterRegistrationBean<>(new CharacterRequestSizeFilter());
        registration.addUrlPatterns("/api/characters", "/api/characters/*");
        registration.setOrder(Ordered.LOWEST_PRECEDENCE);
        return registration;
    }
}
