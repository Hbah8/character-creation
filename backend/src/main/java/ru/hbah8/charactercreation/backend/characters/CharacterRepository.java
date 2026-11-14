package ru.hbah8.charactercreation.backend.characters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import ru.hbah8.charactercreation.backend.worlds.WorldCharacterReferences;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Parameterized PostgreSQL access for account-owned characters. */
@Repository
public class CharacterRepository implements WorldCharacterReferences {
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

    /**
     * Counts characters in one account-owned destination.
     *
     * @param ownerId authenticated account
     * @param worldId world identifier, or null for standalone characters
     * @return destination character count
     */
    public long count(UUID ownerId, UUID worldId) {
        return jdbc.sql("""
                SELECT count(*) FROM app.characters
                WHERE owner_account_id = :owner AND world_id IS NOT DISTINCT FROM CAST(:world AS uuid)
                """).param("owner", ownerId).param("world", worldId).query(Long.class).single();
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
                INSERT INTO app.characters (id, owner_account_id, world_id, character_data)
                VALUES (:id, :owner, :world, CAST(:character AS jsonb))
                RETURNING id, version, created_at, updated_at, character_data
                """).param("id", id).param("owner", ownerId).param("world", worldId(character))
                .param("character", character.toString())
                .query(rowMapper).single();
    }

    Optional<SavedCharacter> update(UUID ownerId, UUID id, long expectedVersion, JsonNode character) {
        return jdbc.sql("""
                UPDATE app.characters
                SET character_data = CAST(:character AS jsonb),
                    world_id = :world,
                    version = version + 1,
                    updated_at = clock_timestamp()
                WHERE owner_account_id = :owner AND id = :id AND version = :version
                RETURNING id, version, created_at, updated_at, character_data
                """).param("character", character.toString()).param("world", worldId(character)).param("owner", ownerId)
                .param("id", id).param("version", expectedVersion).query(rowMapper).optional();
    }

    @Override
    public List<JsonNode> findByWorld(UUID ownerId, UUID worldId) {
        return jdbc.sql("""
                SELECT character_data
                FROM app.characters
                WHERE owner_account_id = :owner AND world_id = :world
                """).param("owner", ownerId).param("world", worldId)
                .query((result, row) -> readCharacter(result.getString("character_data"))).list();
    }

    @Override
    public boolean hasCharacters(UUID ownerId, UUID worldId) {
        return jdbc.sql("""
                SELECT EXISTS (
                    SELECT 1 FROM app.characters
                    WHERE owner_account_id = :owner AND world_id = :world
                )
                """).param("owner", ownerId).param("world", worldId).query(Boolean.class).single();
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

    private JsonNode readCharacter(String value) {
        try {
            return json.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored character JSON is invalid", exception);
        }
    }

    static UUID worldId(JsonNode character) {
        JsonNode value = character.get("worldId");
        return value != null && value.isTextual() && !value.asText().isBlank()
                ? UUID.fromString(value.asText())
                : null;
    }
}
