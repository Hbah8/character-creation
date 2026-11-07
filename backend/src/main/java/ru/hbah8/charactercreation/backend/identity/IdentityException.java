package ru.hbah8.charactercreation.backend.identity;

/** Expected identity failure with a stable, locale-independent API code. */
public class IdentityException extends RuntimeException {
    private final int status;

    public IdentityException(int status, String code) {
        super(code);
        this.status = status;
    }

    public int status() {
        return status;
    }
}
