package ru.hbah8.charactercreation.backend.worlds;

/** An expected world API failure with a stable response code and HTTP status. */
public class WorldException extends RuntimeException {
    private final int status;
    private final String code;

    /**
     * Creates a world API failure.
     *
     * @param status HTTP status
     * @param code stable response code
     */
    public WorldException(int status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    /** Returns the HTTP status for this failure. */
    public int status() {
        return status;
    }

    /** Returns the stable response code for this failure. */
    public String code() {
        return code;
    }
}
