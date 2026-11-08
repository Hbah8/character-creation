package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Parameterized PostgreSQL access for account-owned world aggregates. */
@Repository
public class WorldRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final RowMapper<WorldRoot> rootMapper = this::mapRoot;

    /**
     * Creates the repository.
     *
     * @param jdbc parameterized JDBC client
     * @param json JSON mapper for structured world records
     */
    public WorldRepository(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    List<SavedWorld> list(UUID ownerId) {
        List<UUID> ids = jdbc.sql("""
                SELECT id
                FROM app.worlds
                WHERE owner_account_id = :owner
                ORDER BY updated_at DESC, id
                """).param("owner", ownerId).query(UUID.class).list();
        return ids.stream().map(id -> find(ownerId, id).orElseThrow()).toList();
    }

    Optional<SavedWorld> find(UUID ownerId, UUID id) {
        return findRoot(ownerId, id).map(root -> toSavedWorld(root, readWorld(root)));
    }

    Optional<WorldRoot> findRoot(UUID ownerId, UUID id) {
        return jdbc.sql("""
                SELECT id, version, created_at, updated_at, name, summary,
                       skill_points_budget, attribute_points_budget, race_points_budget, audio_data
                FROM app.worlds
                WHERE owner_account_id = :owner AND id = :id
                """).param("owner", ownerId).param("id", id).query(rootMapper).optional();
    }

    Optional<WorldRoot> findRootForUpdate(UUID ownerId, UUID id) {
        return jdbc.sql("""
                SELECT id, version, created_at, updated_at, name, summary,
                       skill_points_budget, attribute_points_budget, race_points_budget, audio_data
                FROM app.worlds
                WHERE owner_account_id = :owner AND id = :id
                FOR UPDATE
                """).param("owner", ownerId).param("id", id).query(rootMapper).optional();
    }

    SavedWorld readForUpdate(WorldRoot root) {
        return toSavedWorld(root, readWorld(root));
    }

    SavedWorld insert(UUID ownerId, UUID id, JsonNode world) {
        jdbc.sql("""
                INSERT INTO app.worlds (
                    id, owner_account_id, name, summary, skill_points_budget,
                    attribute_points_budget, race_points_budget, audio_data
                )
                VALUES (
                    :id, :owner, :name, :summary, :skillBudget,
                    :attributeBudget, :raceBudget, CAST(:audio AS jsonb)
                )
                """)
                .param("id", id)
                .param("owner", ownerId)
                .param("name", world.path("name").asText())
                .param("summary", world.path("summary").asText())
                .param("skillBudget", budget(world, "skillPointsBudget"))
                .param("attributeBudget", budget(world, "attributePointsBudget"))
                .param("raceBudget", budget(world, "racePointsBudget"))
                .param("audio", world.has("audio") ? world.path("audio").toString() : null)
                .update();
        replaceContents(id, world);
        return find(ownerId, id).orElseThrow();
    }

    Optional<SavedWorld> updateRoot(UUID ownerId, UUID id, long expectedVersion, JsonNode world) {
        Optional<WorldRoot> updated = jdbc.sql("""
                UPDATE app.worlds
                SET name = :name,
                    summary = :summary,
                    skill_points_budget = :skillBudget,
                    attribute_points_budget = :attributeBudget,
                    race_points_budget = :raceBudget,
                    audio_data = CAST(:audio AS jsonb),
                    version = version + 1,
                    updated_at = clock_timestamp()
                WHERE owner_account_id = :owner AND id = :id AND version = :version
                RETURNING id, version, created_at, updated_at, name, summary,
                          skill_points_budget, attribute_points_budget, race_points_budget, audio_data
                """)
                .param("name", world.path("name").asText())
                .param("summary", world.path("summary").asText())
                .param("skillBudget", budget(world, "skillPointsBudget"))
                .param("attributeBudget", budget(world, "attributePointsBudget"))
                .param("raceBudget", budget(world, "racePointsBudget"))
                .param("audio", world.has("audio") ? world.path("audio").toString() : null)
                .param("owner", ownerId)
                .param("id", id)
                .param("version", expectedVersion)
                .query(rootMapper).optional();
        return updated.map(root -> {
            replaceContents(id, world);
            return toSavedWorld(root, readWorld(root));
        });
    }

    boolean delete(UUID ownerId, UUID id, long expectedVersion) {
        return jdbc.sql("""
                DELETE FROM app.worlds
                WHERE owner_account_id = :owner AND id = :id AND version = :version
                """).param("owner", ownerId).param("id", id).param("version", expectedVersion).update() == 1;
    }

    private void replaceContents(UUID worldId, JsonNode world) {
        jdbc.sql("DELETE FROM app.world_relationships WHERE world_id = :world")
                .param("world", worldId).update();
        jdbc.sql("DELETE FROM app.world_entities WHERE world_id = :world")
                .param("world", worldId).update();
        jdbc.sql("DELETE FROM app.world_races WHERE world_id = :world")
                .param("world", worldId).update();
        jdbc.sql("DELETE FROM app.world_handbook_entries WHERE world_id = :world")
                .param("world", worldId).update();

        insertArray(worldId, "app.world_entities", "entity_data", world.path("entities"));
        ArrayNode relationships = (ArrayNode) world.path("relationships");
        for (int index = 0; index < relationships.size(); index++) {
            JsonNode relationship = relationships.get(index);
            jdbc.sql("""
                    INSERT INTO app.world_relationships (
                        world_id, id, sort_order, source_id, target_id, relationship_data
                    )
                    VALUES (:world, :id, :order, :source, :target, CAST(:data AS jsonb))
                    """)
                    .param("world", worldId)
                    .param("id", relationship.path("id").asText())
                    .param("order", index)
                    .param("source", relationship.path("sourceId").asText())
                    .param("target", relationship.path("targetId").asText())
                    .param("data", relationship.toString())
                    .update();
        }
        insertArray(worldId, "app.world_races", "race_data", world.path("races"));
        ArrayNode entries = (ArrayNode) world.path("worldHandbook");
        for (int index = 0; index < entries.size(); index++) {
            JsonNode entry = entries.get(index);
            String category = entry.has("handbookCategory")
                    ? entry.path("handbookCategory").asText()
                    : entry.path("category").asText();
            jdbc.sql("""
                    INSERT INTO app.world_handbook_entries (
                        world_id, handbook_category, id, sort_order, entry_data
                    )
                    VALUES (:world, :category, :id, :order, CAST(:data AS jsonb))
                    """)
                    .param("world", worldId)
                    .param("category", category)
                    .param("id", entry.path("id").asText())
                    .param("order", index)
                    .param("data", entry.toString())
                    .update();
        }
    }

    private void insertArray(UUID worldId, String table, String dataColumn, JsonNode values) {
        for (int index = 0; index < values.size(); index++) {
            JsonNode value = values.get(index);
            jdbc.sql("INSERT INTO " + table + " (world_id, id, sort_order, " + dataColumn + ") "
                            + "VALUES (:world, :id, :order, CAST(:data AS jsonb))")
                    .param("world", worldId)
                    .param("id", value.path("id").asText())
                    .param("order", index)
                    .param("data", value.toString())
                    .update();
        }
    }

    private JsonNode readWorld(WorldRoot root) {
        ObjectNode world = json.createObjectNode()
                .put("schemaVersion", 1)
                .put("name", root.name())
                .put("summary", root.summary());
        ObjectNode settings = world.putObject("settingRules");
        settings.put("skillPointsBudget", root.skillBudget());
        settings.put("attributePointsBudget", root.attributeBudget());
        settings.put("racePointsBudget", root.raceBudget());
        if (root.audioData() != null) {
            world.set("audio", readJson(root.audioData()));
        }
        world.set("entities", readRows("""
                SELECT entity_data FROM app.world_entities WHERE world_id = :world ORDER BY sort_order
                """, root.id()));
        world.set("relationships", readRows("""
                SELECT relationship_data FROM app.world_relationships WHERE world_id = :world ORDER BY sort_order
                """, root.id()));
        world.set("races", readRows("""
                SELECT race_data FROM app.world_races WHERE world_id = :world ORDER BY sort_order
                """, root.id()));
        world.set("worldHandbook", readRows("""
                SELECT entry_data FROM app.world_handbook_entries WHERE world_id = :world ORDER BY sort_order
                """, root.id()));
        return world;
    }

    private ArrayNode readRows(String sql, UUID worldId) {
        List<JsonNode> rows = jdbc.sql(sql).param("world", worldId)
                .query((result, row) -> readJson(result.getString(1))).list();
        ArrayNode result = json.createArrayNode();
        rows.forEach(result::add);
        return result;
    }

    private JsonNode readJson(String value) {
        try {
            return json.readTree(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored world JSON is invalid", exception);
        }
    }

    private static BigDecimal budget(JsonNode world, String key) {
        return world.path("settingRules").path(key).decimalValue();
    }

    private static SavedWorld toSavedWorld(WorldRoot root, JsonNode world) {
        return new SavedWorld(root.id(), root.version(), root.createdAt(), root.updatedAt(), world);
    }

    private WorldRoot mapRoot(ResultSet result, int row) throws SQLException {
        return new WorldRoot(
                result.getObject("id", UUID.class),
                result.getLong("version"),
                result.getTimestamp("created_at").toInstant(),
                result.getTimestamp("updated_at").toInstant(),
                result.getString("name"),
                result.getString("summary"),
                result.getBigDecimal("skill_points_budget"),
                result.getBigDecimal("attribute_points_budget"),
                result.getBigDecimal("race_points_budget"),
                result.getString("audio_data"));
    }

    record WorldRoot(
            UUID id,
            long version,
            Instant createdAt,
            Instant updatedAt,
            String name,
            String summary,
            BigDecimal skillBudget,
            BigDecimal attributeBudget,
            BigDecimal raceBudget,
            String audioData) {
    }
}
