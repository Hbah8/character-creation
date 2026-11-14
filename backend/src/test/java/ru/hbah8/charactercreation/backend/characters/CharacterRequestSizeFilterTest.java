package ru.hbah8.charactercreation.backend.characters;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import ru.hbah8.charactercreation.backend.limits.StorageLimits;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CharacterRequestSizeFilterTest {
    @ParameterizedTest
    @CsvSource({
            "/api/characters,POST,262144,false",
            "/api/characters/id,PUT,262144,true",
            "/api/worlds,POST,2097152,true",
            "/api/worlds/id,PUT,2097152,false"
    })
    void boundsActualBytesWithOrWithoutContentLength(String path, String method, int maximum, boolean chunked)
            throws Exception {
        var limits = new StorageLimits(3, 50, 50, 500, 1000, 50, 500, 262144, 2097152);
        var filter = new CharacterRequestSizeFilter(limits);
        for (int bytes : new int[]{maximum, maximum + 1}) {
            var request = new MockHttpServletRequest(method, path) {
                @Override
                public long getContentLengthLong() {
                    return chunked ? -1 : super.getContentLengthLong();
                }
            };
            request.setContent(new byte[bytes]);
            var response = new MockHttpServletResponse();
            var forwarded = new AtomicInteger();
            filter.doFilter(request, response, (bounded, result) ->
                    forwarded.set(bounded.getInputStream().readAllBytes().length));
            if (bytes == maximum) {
                assertEquals(maximum, forwarded.get());
            } else {
                assertEquals(0, forwarded.get());
                assertEquals(413, response.getStatus());
                assertEquals("{\"code\":\"requestTooLarge\"}", response.getContentAsString());
            }
        }
    }
}
