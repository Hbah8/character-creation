package ru.hbah8.charactercreation.backend.infrastructure;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@ExtendWith(OutputCaptureExtension.class)
class SmtpVerificationMailSenderTest {
    @Test
    void sendsFromConfiguredMailboxWithoutContactingRealSmtp() {
        var sender = mock(JavaMailSender.class);
        var properties = new MailProperties();
        properties.setUsername("sender@example.test");
        new SmtpVerificationMailSender(sender, properties)
                .sendVerification("recipient@example.test", "https://example.test/account#token=test-secret");
        var captured = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(captured.capture());
        var message = captured.getValue();
        assertAll(
                () -> assertEquals(properties.getUsername(), message.getFrom()),
                () -> assertEquals("recipient@example.test", message.getTo()[0]),
                () -> assertTrue(message.getText().contains("https://example.test/account#token=test-secret"))
        );
    }

    @Test
    void reportsDeliveryFailureWithoutLoggingSmtpDiagnosticsOrSecrets(CapturedOutput output) {
        var sender = mock(JavaMailSender.class);
        doThrow(new MailSendException("recipient@example.test token-secret password-secret"))
                .when(sender).send(any(SimpleMailMessage.class));
        new SmtpVerificationMailSender(sender, new MailProperties())
                .sendVerification("recipient@example.test", "https://example.test/account#token=token-secret");
        assertAll(
                () -> assertTrue(output.getAll().contains("Verification email delivery failed")),
                () -> assertFalse(output.getAll().contains("recipient@example.test")),
                () -> assertFalse(output.getAll().contains("token-secret")),
                () -> assertFalse(output.getAll().contains("password-secret"))
        );
    }
}
