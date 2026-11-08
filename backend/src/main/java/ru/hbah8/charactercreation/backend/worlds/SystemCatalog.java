package ru.hbah8.charactercreation.backend.worlds;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Read-only system handbook identities used to validate world overrides and character links. */
@Component
public class SystemCatalog {
    private final Map<String, Set<String>> ids;

    /**
     * Loads the stable identifier manifest generated from the frontend system catalogs.
     *
     * @param json configured JSON mapper
     * @throws IOException if the packaged catalog manifest is missing or malformed
     */
    public SystemCatalog(ObjectMapper json) throws IOException {
        try (InputStream input = SystemCatalog.class.getResourceAsStream("/system-catalog-ids.json")) {
            if (input == null) {
                throw new IOException("System catalog identifier manifest is missing");
            }
            Map<String, List<String>> values = json.readValue(input, new TypeReference<>() { });
            ids = values.entrySet().stream().collect(Collectors.toUnmodifiableMap(
                    Map.Entry::getKey, entry -> Set.copyOf(entry.getValue())));
        }
    }

    /** Returns whether an identifier belongs to the immutable system catalog category. */
    public boolean contains(String category, String id) {
        return ids.getOrDefault(category, Set.of()).contains(id);
    }
}
