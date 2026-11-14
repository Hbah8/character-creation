package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import ru.hbah8.charactercreation.backend.limits.StorageLimits;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;

class WorldValidatorTest {
    private final ObjectMapper json = new ObjectMapper();

    @ParameterizedTest
    @CsvSource({
            "entities,500,worldEntitiesLimitReached",
            "relationships,1000,worldRelationshipsLimitReached",
            "races,50,worldRacesLimitReached",
            "worldHandbook,500,worldHandbookLimitReached"
    })
    void acceptsExactMaximumAndRejectsOneMoreWithSpecificCode(String field, int maximum, String code)
            throws Exception {
        var limits = new StorageLimits(3, 50, 50, 500, 1000, 50, 500, 262144, 2097152);
        var validator = new WorldValidator(new SystemCatalog(json), limits);
        ObjectNode world = json.createObjectNode().put("schemaVersion", 1).put("name", "Limits").put("summary", "");
        var entities = world.putArray("entities");
        world.putArray("relationships");
        world.putArray("races");
        world.putArray("worldHandbook");
        if (field.equals("relationships")) {
            for (int i = 0; i < 2; i++) {
                var entity = entities.addObject().put("id", "entity-" + i).put("type", "note")
                        .put("title", "").put("summary", "").put("description", "");
                entity.putArray("tags");
                entity.putObject("position").put("x", 0).put("y", 0);
            }
        }
        var values = world.withArray(field);
        for (int i = 0; i <= maximum; i++) {
            if (i == maximum) {
                assertEquals(maximum, validator.validate(world).path(field).size());
            }
            var value = values.addObject().put("id", "entry-" + i);
            switch (field) {
                case "entities" -> {
                    value.put("type", "note").put("title", "").put("summary", "").put("description", "");
                    value.putArray("tags");
                    value.putObject("position").put("x", 0).put("y", 0);
                }
                case "relationships" -> value.put("sourceId", "entity-0").put("targetId", "entity-1")
                        .put("type", "custom").put("label", "").put("description", "");
                case "races" -> {
                    value.put("name", "Race").put("description", "").put("size", 0);
                    value.putArray("abilities");
                }
                case "worldHandbook" -> value.put("handbookCategory", "gear").put("mode", "custom")
                        .put("name", "Kit").put("description", "").put("category", "Tools");
                default -> throw new IllegalArgumentException(field);
            }
        }
        var error = assertThrowsExactly(WorldException.class, () -> validator.validate(world));
        assertEquals(code, error.code());
        assertEquals(400, error.status());
    }
}
