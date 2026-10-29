package com.becas.backend.validation;

import java.nio.charset.StandardCharsets;

/** Política para nuevas cuentas; no cambia las contraseñas guardadas. */
public final class PasswordPolicy {
    public static final int MIN_CODE_POINTS = 15;
    public static final int MAX_UTF8_BYTES = 72;
    private PasswordPolicy() { }

    public static boolean registroValido(String password) {
        return password != null && !password.isBlank()
            && password.codePointCount(0, password.length()) >= MIN_CODE_POINTS
            && !superaLimite(password);
    }
    public static boolean superaLimite(String password) {
        return password != null && password.getBytes(StandardCharsets.UTF_8).length > MAX_UTF8_BYTES;
    }
}
