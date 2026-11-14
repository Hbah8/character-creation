package ru.hbah8.charactercreation.backend.characters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ReadListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.hbah8.charactercreation.backend.limits.StorageLimits;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/** Enforces bounded JSON request bodies for characters and worlds, including chunked requests. */
public class CharacterRequestSizeFilter extends OncePerRequestFilter {
    private final StorageLimits limits;

    /**
     * Creates the bounded request reader.
     *
     * @param limits character and world byte ceilings
     */
    public CharacterRequestSizeFilter(StorageLimits limits) {
        this.limits = limits;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        boolean characterPath = path.equals("/api/characters") || path.startsWith("/api/characters/");
        boolean worldPath = path.equals("/api/worlds") || path.startsWith("/api/worlds/");
        return !(characterPath || worldPath)
                || !(method.equals("POST") || method.equals("PUT"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        int maximum = request.getRequestURI().startsWith("/api/characters")
                ? limits.characterRequestBytes() : limits.worldRequestBytes();
        if (request.getContentLengthLong() > maximum) {
            tooLarge(response);
            return;
        }
        byte[] body = request.getInputStream().readNBytes(maximum + 1);
        if (body.length > maximum) {
            tooLarge(response);
            return;
        }
        chain.doFilter(new BoundedBodyRequest(request, body), response);
    }

    private static void tooLarge(HttpServletResponse response) throws IOException {
        response.setStatus(413);
        response.setContentType("application/json");
        response.getWriter().write("{\"code\":\"requestTooLarge\"}");
    }

    private static final class BoundedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        private BoundedBodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public int getContentLength() {
            return body.length;
        }

        @Override
        public long getContentLengthLong() {
            return body.length;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return input.read();
                }

                @Override
                public boolean isFinished() {
                    return input.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    if (listener == null) {
                        throw new IllegalArgumentException("ReadListener is required");
                    }
                    try {
                        if (input.available() > 0) {
                            listener.onDataAvailable();
                        } else {
                            listener.onAllDataRead();
                        }
                    } catch (IOException exception) {
                        listener.onError(exception);
                    }
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
