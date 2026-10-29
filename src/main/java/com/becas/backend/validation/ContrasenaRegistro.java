package com.becas.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ContrasenaRegistroValidator.class)
@Documented
public @interface ContrasenaRegistro {
    String message() default "Usa al menos 15 caracteres y no superes el límite de longitud de la contraseña.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
