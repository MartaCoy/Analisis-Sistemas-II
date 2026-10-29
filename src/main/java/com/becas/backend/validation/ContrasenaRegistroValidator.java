package com.becas.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ContrasenaRegistroValidator implements ConstraintValidator<ContrasenaRegistro, String> {
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        // @NotBlank se encarga de los valores vacíos.
        if (password == null || password.isBlank()) return true;
        if (PasswordPolicy.registroValido(password)) return true;
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(PasswordPolicy.superaLimite(password)
            ? "La contraseña supera el límite permitido. Acórtala un poco."
            : "Usa al menos 15 caracteres. Puedes escribir una frase con espacios.")
            .addConstraintViolation();
        return false;
    }
}
