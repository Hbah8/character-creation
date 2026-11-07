package ru.hbah8.charactercreation.backend.infrastructure;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import ru.hbah8.charactercreation.backend.identity.VerificationMailSender;

/** SMTP adapter; local Mailpit and production providers use the same boundary. */
@Component
public class SmtpVerificationMailSender implements VerificationMailSender {
    private static final Logger LOG = LoggerFactory.getLogger(SmtpVerificationMailSender.class);
    private final JavaMailSender sender;
    private final MailProperties properties;

    public SmtpVerificationMailSender(JavaMailSender sender, MailProperties properties) {
        this.sender = sender;
        this.properties = properties;
    }

    @Override
    public void sendVerification(String email, String confirmationUrl) {
        var message = new SimpleMailMessage();
        message.setFrom(properties.getUsername());
        message.setTo(email);
        message.setSubject("Confirm your SWADE account");
        message.setText("Open this link and confirm your email:\n" + confirmationUrl
                + "\n\nThis link is single-use and expires. If you did not request it, ignore this email.");
        try {
            sender.send(message);
        } catch (MailException exception) {
            // Same generic HTTP result for all emails, including delivery failures.
            // Do not log the exception: SMTP diagnostics can contain recipient or secret data.
            LOG.error("Verification email delivery failed; check SMTP availability/configuration. User may retry resend.");
        }
    }
}
