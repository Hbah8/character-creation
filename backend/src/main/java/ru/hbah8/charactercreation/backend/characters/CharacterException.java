package ru.hbah8.charactercreation.backend.characters;

/** An expected character API failure with a stable response code and HTTP status. */
public class CharacterException extends RuntimeException {
    private final int status;
    private final String code;

    /**
     * Creates a character API failure.
     *
     * @param status HTTP status
     * @param code stable response code
     */
    public CharacterException(int status, String code) {
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
