package ru.hbah8.charactercreation.backend.admin;

/** Expected administrative operation failure with a stable public error code. */
public class AdminException extends RuntimeException {
    private final int status;
    private final String code;

    public AdminException(int status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }
}
