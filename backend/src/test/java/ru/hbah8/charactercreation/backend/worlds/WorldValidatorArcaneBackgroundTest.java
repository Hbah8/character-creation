package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import ru.hbah8.charactercreation.backend.limits.StorageLimits;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrowsExactly;

class WorldValidatorArcaneBackgroundTest {
    private final ObjectMapper json = new ObjectMapper();
    private final WorldValidator validator;

    WorldValidatorArcaneBackgroundTest() throws IOException {
        validator = createValidator();
    }

    @Test
    void acceptsCustomArcaneBackgroundAndEdgeRequirementReferences() throws Exception {
        ObjectNode world = newWorld();
        world.withArray("worldHandbook")
                .addObject()
                .put("mode", "custom")
                .put("handbookCategory", "arcaneBackground")
                .put("id", "ancestral-magic")
                .put("name", "Ancestral Magic")
                .put("description", "A family tradition.")
                .put("skillId", "faith");
        var edge = world.withArray("worldHandbook").addObject()
                .put("mode", "custom")
                .put("handbookCategory", "edge")
                .put("id", "ancestral-edge")
                .put("name", "Ancestral Edge")
                .put("description", "A custom edge.")
                .put("type", "Power");
        edge.putObject("requirements").putArray("allOf").addObject()
                .put("type", "edge")
                .put("edgeId", "misticheskiy-dar")
                .put("arcaneBackground", "ancestral-magic");

        assertEquals(2, validator.validate(world).path("worldHandbook").size());
    }

    @Test
    void rejectsArcaneBackgroundWithUnknownMysticSkill() throws Exception {
        ObjectNode world = newWorld();
        world.withArray("worldHandbook")
                .addObject()
                .put("mode", "custom")
                .put("handbookCategory", "arcaneBackground")
                .put("id", "ancestral-magic")
                .put("name", "Ancestral Magic")
                .put("description", "A family tradition.")
                .put("skillId", "missing-skill");

        var error = assertThrowsExactly(WorldException.class, () -> validator.validate(world));

        assertEquals("invalidReference", error.code());
    }

    @Test
    void allowsSystemBackgroundOverrideToInheritItsSkill() {
        ObjectNode world = newWorld();
        world.withArray("worldHandbook")
                .addObject()
                .put("mode", "override")
                .put("handbookCategory", "arcaneBackground")
                .put("id", "Magic")
                .put("name", "Sorcery");

        assertEquals(1, validator.validate(world).path("worldHandbook").size());
    }

    @Test
    void acceptsArcaneBackgroundAndNewPowersModifiers() throws Exception {
        ObjectNode world = newWorld();
        ObjectNode background = world.withArray("worldHandbook").addObject();
        background.put("mode", "custom")
                .put("handbookCategory", "arcaneBackground")
                .put("id", "ancestral-magic")
                .put("name", "Ancestral Magic")
                .put("description", "")
                .put("skillId", "faith");
        background.putArray("modifiers")
                .addObject()
                .put("type", "combat")
                .put("stat", "powerPoints")
                .put("amount", 10);
        background.withArray("modifiers")
                .addObject()
                .put("type", "powers-count")
                .put("amount", 3);

        assertEquals(1, validator.validate(world).path("worldHandbook").size());
    }

    @Test
    void rejectsDeletingBackgroundReferencedByCharacter() {
        ObjectNode world = newWorld();
        ObjectNode character = json.createObjectNode().put("arcaneBackground", "ancestral-magic");

        var error = assertThrowsExactly(WorldException.class,
                () -> validator.validateCharacterReferences(character, world));

        assertEquals("invalidReference", error.code());
    }

    private WorldValidator createValidator() throws IOException {
        return new WorldValidator(new SystemCatalog(json),
                new StorageLimits(3, 50, 50, 500, 1000, 50, 500, 262144, 2097152));
    }

    private ObjectNode newWorld() {
        ObjectNode world = json.createObjectNode().put("schemaVersion", 1).put("name", "Arcane").put("summary", "");
        world.putArray("entities");
        world.putArray("relationships");
        world.putArray("races");
        world.putArray("worldHandbook");
        return world;
    }
}
