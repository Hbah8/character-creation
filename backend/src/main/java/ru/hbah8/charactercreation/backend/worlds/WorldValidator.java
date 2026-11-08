package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/** Validates the serializable world contract and every stable world-scoped reference. */
@Component
public class WorldValidator {
    private static final Set<String> HANDBOOK_CATEGORIES = Set.of(
            "edge", "hindrance", "skill", "weapon", "gear", "power", "mount", "racialAbility");
    private static final Set<String> ENTITY_TYPES = Set.of("location", "faction", "npc", "event", "item", "note");
    private static final Set<String> RELATIONSHIP_TYPES = Set.of(
            "controls", "belongs_to", "located_in", "ally", "enemy", "knows", "caused", "mentions", "custom");
    private static final Set<String> ATTRIBUTES = Set.of("agility", "strength", "smarts", "spirit", "vigor");
    private static final Set<String> RANKS = Set.of("Novice", "Seasoned", "Veteran", "Heroic", "Legendary");
    private static final Set<String> DICE = Set.of("d4", "d6", "d8", "d10", "d12");
    private static final Set<String> EDGE_TYPES = Set.of(
            "Background", "Combat", "Leadership", "Power", "Professional", "Social", "Weird", "WildCard");
    private static final Set<String> WEAPON_CATEGORIES = Set.of("Melee", "Ranged", "Thrown", "Unarmed");
    private static final Set<String> GEAR_CATEGORIES = Set.of("Adventuring", "Clothing", "Food", "Tools", "Other");
    private static final Set<String> ARCANE_BACKGROUNDS = Set.of(
            "Magic", "Miracles", "Psionics", "SuperPowers", "WeirdScience");
    private static final Set<String> MODIFIER_STATS = Set.of(
            "pace", "parry", "toughness", "armor", "runningDieSteps", "bennies", "maxWounds", "maxFatigue",
            "powerPoints");
    private static final Set<String> MAX_REPEAT_VALUES = Set.of("unlimited");

    private final SystemCatalog catalog;

    /**
     * Creates the world contract validator.
     *
     * @param catalog immutable system handbook identifiers
     */
    public WorldValidator(SystemCatalog catalog) {
        this.catalog = catalog;
    }

    /** Validates and applies documented defaults to an incoming world payload. */
    public ObjectNode validate(JsonNode input) {
        if (input == null || !input.isObject()) {
            throw invalidWorld();
        }
        ObjectNode world = (ObjectNode) input.deepCopy();
        if (!world.path("schemaVersion").isIntegralNumber() || world.path("schemaVersion").intValue() != 1
                || !validText(world.get("name"), 1000)
                || !validText(world.get("summary"), 100000)) {
            throw invalidWorld();
        }
        validateSettings(world);
        JsonNode entities = world.get("entities");
        JsonNode relationships = world.get("relationships");
        if (entities == null || !entities.isArray() || relationships == null || !relationships.isArray()) {
            throw invalidWorld();
        }
        validateEntities(entities);
        validateRelationships(relationships, entities);
        if (world.has("races") && !world.path("races").isArray()) {
            throw invalidWorld();
        }
        if (!world.has("races")) {
            world.putArray("races");
        }
        if (world.has("worldHandbook") && !world.path("worldHandbook").isArray()) {
            throw invalidWorld();
        }
        if (!world.has("worldHandbook")) {
            world.putArray("worldHandbook");
        }
        if (world.has("audio") && !world.path("audio").isObject()) {
            throw invalidWorld();
        }
        validateHandbook(world.path("worldHandbook"));
        validateRaces(world.path("races"), world);
        validateHandbookReferences(world);
        return world;
    }

    /** Validates a linked character's references against a previously resolved world. */
    public void validateCharacterReferences(JsonNode character, JsonNode world) {
        if (character == null || !character.isObject() || world == null || !world.isObject()) {
            throw invalidReference();
        }
        JsonNode raceId = character.get("raceId");
        if (raceId != null && !raceId.isNull()
                && (!raceId.isTextual() || !containsId(world.path("races"), raceId.asText()))) {
            throw invalidReference();
        }
        for (JsonNode skill : character.path("skills")) {
            if (!skill.isObject() || !skill.path("skillKey").isTextual()
                    || !hasResolvedEntry(world, "skill", skill.path("skillKey").asText())) {
                throw invalidReference();
            }
        }
        for (JsonNode edge : character.path("edges")) {
            if (!edge.isObject() || !edge.path("edgeId").isTextual()
                    || !hasResolvedEntry(world, "edge", edge.path("edgeId").asText())) {
                throw invalidReference();
            }
        }
        for (JsonNode hindrance : character.path("hindrances")) {
            JsonNode hindranceId = hindrance.path("hindranceId");
            if (hindranceId.isTextual()) {
                if (!hasResolvedEntry(world, "hindrance", hindranceId.asText())) {
                    throw invalidReference();
                }
            } else if (!hindrance.path("name").isTextual()
                    || !hindrance.path("severity").isTextual()
                    || !hindrance.path("description").isTextual()) {
                throw invalidReference();
            }
        }
    }

    private void validateSettings(ObjectNode world) {
        JsonNode settings = world.get("settingRules");
        if (settings == null || settings.isNull()) {
            settings = world.objectNode();
            ((ObjectNode) settings).put("skillPointsBudget", 12);
            ((ObjectNode) settings).put("attributePointsBudget", 5);
            ((ObjectNode) settings).put("racePointsBudget", 2);
            world.set("settingRules", settings);
        }
        if (!settings.isObject()) {
            throw invalidWorld();
        }
        ObjectNode values = (ObjectNode) settings;
        validateBudget(values, "skillPointsBudget", 12);
        validateBudget(values, "attributePointsBudget", 5);
        validateBudget(values, "racePointsBudget", 2);
    }

    private void validateBudget(ObjectNode settings, String key, int fallback) {
        JsonNode value = settings.get(key);
        if (value == null) {
            settings.put(key, fallback);
            return;
        }
        if (!value.isNumber() || !Double.isFinite(value.doubleValue())
                || value.doubleValue() <= 0 || value.doubleValue() > 1_000_000) {
            throw invalidWorld();
        }
    }

    private static void validateEntities(JsonNode entities) {
        Set<String> ids = new HashSet<>();
        for (JsonNode entity : entities) {
            if (!entity.isObject()
                    || !validId(entity.path("id"))
                    || !ids.add(entity.path("id").asText())
                    || !entity.path("type").isTextual()
                    || !ENTITY_TYPES.contains(entity.path("type").asText())
                    || !validText(entity.get("title"), 100000)
                    || !validText(entity.get("summary"), 100000)
                    || !validText(entity.get("description"), 100000)
                    || !entity.path("tags").isArray()
                    || !entity.path("position").isObject()
                    || !finiteNumber(entity.path("position").get("x"))
                    || !finiteNumber(entity.path("position").get("y"))) {
                throw invalidWorld();
            }
            for (JsonNode tag : entity.path("tags")) {
                if (!tag.isTextual() || tag.textValue().length() > 1000) {
                    throw invalidWorld();
                }
            }
        }
    }

    private static void validateRelationships(JsonNode relationships, JsonNode entities) {
        Set<String> entityIds = new HashSet<>();
        entities.forEach(entity -> entityIds.add(entity.path("id").asText()));
        Set<String> relationshipIds = new HashSet<>();
        for (JsonNode relationship : relationships) {
            String source = relationship.path("sourceId").asText();
            String target = relationship.path("targetId").asText();
            if (!relationship.isObject()
                    || !validId(relationship.path("id"))
                    || !relationshipIds.add(relationship.path("id").asText())
                    || !validId(relationship.path("sourceId"))
                    || !validId(relationship.path("targetId"))
                    || !entityIds.contains(source)
                    || !entityIds.contains(target)
                    || source.equals(target)
                    || !relationship.path("type").isTextual()
                    || !RELATIONSHIP_TYPES.contains(relationship.path("type").asText())
                    || !validText(relationship.get("label"), 100000)
                    || !validText(relationship.get("description"), 100000)) {
                throw invalidWorld();
            }
        }
    }

    private void validateHandbook(JsonNode entries) {
        Set<String> identities = new HashSet<>();
        for (JsonNode entry : entries) {
            if (!entry.isObject()) {
                throw invalidWorld();
            }
            String category = handbookCategory(entry);
            JsonNode idNode = entry.get("id");
            if (!HANDBOOK_CATEGORIES.contains(category) || !validId(idNode)
                    || !identities.add(category + ":" + idNode.asText())) {
                throw invalidWorld();
            }
            JsonNode modeNode = entry.get("mode");
            String mode = modeNode == null ? "" : modeNode.asText();
            if (modeNode != null && (!modeNode.isTextual()
                    || !Set.of("custom", "override").contains(mode))) {
                throw invalidWorld();
            }
            boolean systemEntry = catalog.contains(category, idNode.asText());
            if (("custom".equals(mode) && systemEntry)
                    || ("override".equals(mode) && !systemEntry)) {
                throw invalidWorld();
            }
            validateEntryFields(entry, category, "custom".equals(mode));
        }
    }

    private static void validateEntryFields(JsonNode entry, String category, boolean custom) {
        if (custom && (!validText(entry.get("name"), 100000) || !validText(entry.get("description"), 100000))) {
            throw invalidWorld();
        }
        if (entry.has("name") && !validText(entry.get("name"), 100000)
                || entry.has("description") && !validText(entry.get("description"), 100000)) {
            throw invalidWorld();
        }
        switch (category) {
            case "skill" -> {
                if (custom && (!entry.path("linkedAttribute").isTextual()
                        || !ATTRIBUTES.contains(entry.path("linkedAttribute").asText())
                        || !entry.path("isCore").isBoolean())) {
                    throw invalidWorld();
                }
                if (entry.has("linkedAttribute") && (!entry.path("linkedAttribute").isTextual()
                        || !ATTRIBUTES.contains(entry.path("linkedAttribute").asText()))
                        || entry.has("isCore") && !entry.path("isCore").isBoolean()) {
                    throw invalidWorld();
                }
            }
            case "edge" -> {
                if (custom && (!entry.path("type").isTextual()
                        || !EDGE_TYPES.contains(entry.path("type").asText()))) {
                    throw invalidWorld();
                }
                if (entry.has("type") && (!entry.path("type").isTextual()
                        || !EDGE_TYPES.contains(entry.path("type").asText()))) {
                    throw invalidWorld();
                }
            }
            case "hindrance" -> {
                if (custom && (!entry.path("type").isTextual()
                        || !Set.of("Major", "Minor").contains(entry.path("type").asText()))) {
                    throw invalidWorld();
                }
                if (entry.has("type") && (!entry.path("type").isTextual()
                        || !Set.of("Major", "Minor").contains(entry.path("type").asText()))) {
                    throw invalidWorld();
                }
            }
            case "weapon" -> {
                if (custom && (!entry.path("category").isTextual()
                        || !WEAPON_CATEGORIES.contains(entry.path("category").asText())
                        || !validText(entry.get("damage"), 1000))) {
                    throw invalidWorld();
                }
                if (entry.has("category") && (!entry.path("category").isTextual()
                        || !WEAPON_CATEGORIES.contains(entry.path("category").asText()))) {
                    throw invalidWorld();
                }
            }
            case "gear" -> {
                if (custom && (!entry.path("category").isTextual()
                        || !GEAR_CATEGORIES.contains(entry.path("category").asText()))) {
                    throw invalidWorld();
                }
                if (entry.has("category") && (!entry.path("category").isTextual()
                        || !GEAR_CATEGORIES.contains(entry.path("category").asText()))) {
                    throw invalidWorld();
                }
            }
            case "power" -> {
                if (custom && (!entry.path("arcaneBackground").isArray()
                        || !validText(entry.get("ppCost"), 1000) || !validText(entry.get("range"), 1000)
                        || !validText(entry.get("duration"), 1000))) {
                    throw invalidWorld();
                }
                if (entry.has("arcaneBackground")) {
                    if (!entry.path("arcaneBackground").isArray()) {
                        throw invalidWorld();
                    }
                    for (JsonNode background : entry.path("arcaneBackground")) {
                        if (!background.isTextual() || !ARCANE_BACKGROUNDS.contains(background.asText())) {
                            throw invalidWorld();
                        }
                    }
                }
            }
            case "mount" -> {
                if (custom && (!entry.path("category").isTextual()
                        || !Set.of("animal", "vehicle").contains(entry.path("category").asText())
                        || !finiteNumber(entry.get("toughness")))) {
                    throw invalidWorld();
                }
                if (entry.has("category") && (!entry.path("category").isTextual()
                        || !Set.of("animal", "vehicle").contains(entry.path("category").asText()))
                        || entry.has("toughness") && !finiteNumber(entry.get("toughness"))) {
                    throw invalidWorld();
                }
            }
            case "racialAbility" -> {
                if (custom && (!entry.path("type").isTextual()
                        || !Set.of("positive", "negative").contains(entry.path("type").asText()))) {
                    throw invalidWorld();
                }
                if (entry.has("type") && (!entry.path("type").isTextual()
                        || !Set.of("positive", "negative").contains(entry.path("type").asText()))
                        || entry.has("points") && !finiteNumber(entry.get("points"))) {
                    throw invalidWorld();
                }
                validateNumberArray(entry.get("pointCostOptions"));
                JsonNode maxRepeat = entry.get("maxRepeat");
                if (maxRepeat != null && !finiteNumber(maxRepeat)
                        && !(maxRepeat.isTextual() && MAX_REPEAT_VALUES.contains(maxRepeat.asText()))) {
                    throw invalidWorld();
                }
                if (entry.has("parameterSchema") && !entry.path("parameterSchema").isArray()
                        || entry.has("effects") && !entry.path("effects").isArray()) {
                    throw invalidWorld();
                }
            }
            default -> throw invalidWorld();
        }
        validateModifiers(entry.get("modifiers"));
    }

    private void validateRaces(JsonNode races, JsonNode world) {
        Set<String> ids = new HashSet<>();
        for (JsonNode race : races) {
            if (!race.isObject() || !validId(race.path("id")) || !ids.add(race.path("id").asText())
                    || !validText(race.get("name"), 100000)
                    || race.has("description") && !validText(race.get("description"), 100000)
                    || race.has("size") && !finiteNumber(race.get("size"))
                    || race.has("abilities") && !race.path("abilities").isArray()) {
                throw invalidWorld();
            }
            for (JsonNode ability : race.path("abilities")) {
                if (!ability.isObject() || !validId(ability.path("id"))
                        || !hasResolvedEntry(world, "racialAbility", ability.path("id").asText())
                        || ability.has("repeatCount") && (!finiteNumber(ability.get("repeatCount"))
                        || ability.path("repeatCount").doubleValue() <= 0)
                        || ability.has("parameters") && !ability.path("parameters").isObject()) {
                    throw invalidReference();
                }
                validateParameterReferences(ability.path("parameters"), world);
            }
        }
    }

    private void validateHandbookReferences(JsonNode world) {
        for (JsonNode entry : world.path("worldHandbook")) {
            String category = handbookCategory(entry);
            if ("edge".equals(category)) {
                validateEdgeRequirements(entry.path("requirements"), world);
            }
            validateParameterReferences(entry.path("parameters"), world);
        }
    }

    private void validateEdgeRequirements(JsonNode requirements, JsonNode world) {
        if (requirements == null || requirements.isMissingNode() || requirements.isNull()) {
            return;
        }
        if (!requirements.isObject()) {
            throw invalidWorld();
        }
        validateRequirementList(requirements.path("allOf"), world);
        validateRequirementList(requirements.path("anyOf"), world);
        JsonNode alternatives = requirements.path("edges");
        if (alternatives.isArray()) {
            for (JsonNode edgeId : alternatives) {
                requireReference(world, "edge", edgeId);
            }
        }
        JsonNode skills = requirements.path("skills");
        if (skills.isObject()) {
            Iterator<String> names = skills.fieldNames();
            while (names.hasNext()) {
                requireReference(world, "skill", names.next());
            }
        }
    }

    private void validateRequirementList(JsonNode requirements, JsonNode world) {
        if (requirements == null || !requirements.isArray()) {
            return;
        }
        for (JsonNode requirement : requirements) {
            if (requirement.has("anyOf")) {
                validateRequirementList(requirement.path("anyOf"), world);
                continue;
            }
            String type = requirement.path("type").asText();
            switch (type) {
                case "edge" -> requireReference(world, "edge", requirement.get("edgeId"));
                case "hindrance" -> requireReference(world, "hindrance", requirement.get("hindranceId"));
                case "race" -> {
                    JsonNode raceId = requirement.get("raceId");
                    if (raceId == null || !raceId.isTextual()
                            || !containsId(world.path("races"), raceId.asText())) {
                        throw invalidReference();
                    }
                }
                case "skill" -> requireReference(world, "skill", requirement.get("skill"));
                case "rank", "attribute", "wildCard", "text" -> {
                }
                default -> throw invalidWorld();
            }
        }
    }

    private void validateParameterReferences(JsonNode parameters, JsonNode world) {
        if (parameters == null || !parameters.isObject()) {
            return;
        }
        requireOptionalReference(world, "skill", parameters.get("skillId"));
        requireOptionalReference(world, "edge", parameters.get("edgeId"));
        requireOptionalReference(world, "hindrance", parameters.get("hindranceId"));
    }

    private void requireOptionalReference(JsonNode world, String category, JsonNode id) {
        if (id == null || id.isNull() || id.asText().isBlank()) {
            return;
        }
        requireReference(world, category, id);
    }

    private void requireReference(JsonNode world, String category, JsonNode id) {
        if (id == null || !id.isTextual() || !hasResolvedEntry(world, category, id.asText())) {
            throw invalidReference();
        }
    }

    private void requireReference(JsonNode world, String category, String id) {
        if (id == null || !hasResolvedEntry(world, category, id)) {
            throw invalidReference();
        }
    }

    private boolean hasResolvedEntry(JsonNode world, String category, String id) {
        if (catalog.contains(category, id)) {
            return true;
        }
        for (JsonNode entry : world.path("worldHandbook")) {
            if (category.equals(handbookCategory(entry)) && id.equals(entry.path("id").asText())
                    && !"override".equals(entry.path("mode").asText())) {
                return true;
            }
        }
        return false;
    }

    private static String handbookCategory(JsonNode entry) {
        JsonNode category = entry.get("handbookCategory");
        if (category == null) {
            category = entry.get("category");
        }
        return category != null && category.isTextual() ? category.asText() : "";
    }

    private static boolean containsId(JsonNode records, String id) {
        for (JsonNode record : records) {
            if (id.equals(record.path("id").asText())) {
                return true;
            }
        }
        return false;
    }

    private static void validateModifiers(JsonNode modifiers) {
        if (modifiers == null) {
            return;
        }
        if (!modifiers.isArray()) {
            throw invalidWorld();
        }
        for (JsonNode modifier : modifiers) {
            if (!modifier.isObject() || !finiteNumber(modifier.get("amount"))) {
                throw invalidWorld();
            }
            String type = modifier.path("type").asText();
            if ("combat".equals(type)) {
                if (!modifier.path("stat").isTextual()
                        || !MODIFIER_STATS.contains(modifier.path("stat").asText())) {
                    throw invalidWorld();
                }
            } else if ("attribute-die-step".equals(type)) {
                if (!modifier.path("attribute").isTextual()
                        || !ATTRIBUTES.contains(modifier.path("attribute").asText())
                        || !modifier.path("amount").isIntegralNumber()) {
                    throw invalidWorld();
                }
            } else {
                throw invalidWorld();
            }
        }
    }

    private static void validateNumberArray(JsonNode values) {
        if (values == null) {
            return;
        }
        if (!values.isArray()) {
            throw invalidWorld();
        }
        for (JsonNode value : values) {
            if (!finiteNumber(value)) {
                throw invalidWorld();
            }
        }
    }

    private static boolean validId(JsonNode value) {
        return value != null && value.isTextual() && !value.textValue().isBlank()
                && value.textValue().length() <= 255;
    }

    private static boolean validText(JsonNode value, int maxLength) {
        return value != null && value.isTextual() && value.textValue().length() <= maxLength;
    }

    private static boolean finiteNumber(JsonNode value) {
        return value != null && value.isNumber() && Double.isFinite(value.doubleValue());
    }

    private static WorldException invalidWorld() {
        return new WorldException(400, "invalidWorld");
    }

    private static WorldException invalidReference() {
        return new WorldException(400, "invalidReference");
    }
}
