package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Parameterized PostgreSQL access for account-owned standalone characters. */
@Repository
public class CharacterRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final RowMapper<SavedCharacter> rowMapper;

    /**
     * Creates the repository.
     *
     * @param jdbc parameterized JDBC client
     * @param json JSON mapper for the stored character payload
     */
    public CharacterRepository(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
        this.rowMapper = this::mapRow;
    }

    List<SavedCharacter> list(UUID ownerId) {
        return jdbc.sql("""
                SELECT id, version, created_at, updated_at, character_data
                FROM app.characters
                WHERE owner_account_id = :owner
                ORDER BY updated_at DESC, id
                """).param("owner", ownerId).query(rowMapper).list();
    }

    Optional<SavedCharacter> find(UUID ownerId, UUID id) {
        return jdbc.sql("""
                SELECT id, version, created_at, updated_at, character_data
                FROM app.characters
                WHERE owner_account_id = :owner AND id = :id
                """).param("owner", ownerId).param("id", id).query(rowMapper).optional();
    }

    SavedCharacter insert(UUID ownerId, UUID id, JsonNode character) {
        return jdbc.sql("""
                INSERT INTO app.characters (id, owner_account_id, character_data)
                VALUES (:id, :owner, CAST(:character AS jsonb))
                RETURNING id, version, created_at, updated_at, character_data
                """).param("id", id).param("owner", ownerId).param("character", character.toString())
                .query(rowMapper).single();
    }

    Optional<SavedCharacter> update(UUID ownerId, UUID id, long expectedVersion, JsonNode character) {
        return jdbc.sql("""
                UPDATE app.characters
                SET character_data = CAST(:character AS jsonb),
                    version = version + 1,
                    updated_at = clock_timestamp()
                WHERE owner_account_id = :owner AND id = :id AND version = :version
                RETURNING id, version, created_at, updated_at, character_data
                """).param("character", character.toString()).param("owner", ownerId)
                .param("id", id).param("version", expectedVersion).query(rowMapper).optional();
    }

    boolean delete(UUID ownerId, UUID id, long expectedVersion) {
        return jdbc.sql("""
                DELETE FROM app.characters
                WHERE owner_account_id = :owner AND id = :id AND version = :version
                """).param("owner", ownerId).param("id", id).param("version", expectedVersion).update() == 1;
    }

    private SavedCharacter mapRow(ResultSet result, int row) throws SQLException {
        try {
            JsonNode character = json.readTree(result.getString("character_data"));
            return new SavedCharacter(result.getObject("id", UUID.class), result.getLong("version"),
                    result.getTimestamp("created_at").toInstant(), result.getTimestamp("updated_at").toInstant(),
                    character);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored character JSON is invalid", exception);
        }
    }

}
