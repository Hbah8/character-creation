package ru.hbah8.charactercreation.backend.identity;

/** Outbound boundary for email verification delivery. */
@FunctionalInterface
public interface VerificationMailSender {
    /**
     * Sends a confirmation link without logging its secret.
     * @param email normalized recipient
     * @param confirmationUrl one-time link
     */
    void sendVerification(String email, String confirmationUrl);
}
