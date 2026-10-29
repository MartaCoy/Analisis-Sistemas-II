package com.becas.backend.validation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyTest {
    @Test void rechazaNulaYVacia() { assertFalse(PasswordPolicy.registroValido(null)); assertFalse(PasswordPolicy.registroValido(" ".repeat(20))); }
    @Test void minimoQuinceCaracteres() { assertFalse(PasswordPolicy.registroValido("a".repeat(14))); assertTrue(PasswordPolicy.registroValido("a".repeat(15))); }
    @Test void aceptaFraseSinReglasArbitrarias() { assertTrue(PasswordPolicy.registroValido("bosque nube camino violeta")); }
    @Test void respetaBytesBcrypt() { assertTrue(PasswordPolicy.registroValido("a".repeat(72))); assertFalse(PasswordPolicy.registroValido("a".repeat(73))); }
    @Test void cuentaUnicodePorCaracterYPorByte() { assertTrue(PasswordPolicy.registroValido("á".repeat(36))); assertFalse(PasswordPolicy.registroValido("á".repeat(37))); }
    @Test void loginNoAplicaMinimoNuevo() { assertFalse(PasswordPolicy.superaLimite("corta")); }
}
