package ru.hbah8.charactercreation.backend.application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Starts the SWADE Campaign Manager backend.
 */
@SpringBootApplication
public class CharacterCreationApplication {

    /**
     * Starts the Spring Boot application.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(CharacterCreationApplication.class, args);
    }
}
