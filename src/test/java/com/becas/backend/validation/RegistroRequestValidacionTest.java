package com.becas.backend.validation;

import com.becas.backend.dto.RegistroRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class RegistroRequestValidacionTest {
    private static ValidatorFactory factory;
    private static Validator validator;
    @BeforeAll static void iniciar() { factory = Validation.buildDefaultValidatorFactory(); validator = factory.getValidator(); }
    @AfterAll static void cerrar() { factory.close(); }
    private RegistroRequest valido() {
        RegistroRequest r = new RegistroRequest(); r.setNombreCompleto("Persona Prueba");
        r.setCorreo("persona@example.com"); r.setCarnet("12345678901"); r.setUniversidadId(1L);
        r.setPassword("bosque nube camino violeta"); return r;
    }
    @Test void aceptaRegistroValido() { assertTrue(validator.validate(valido()).isEmpty()); }
    @Test void validaPasswordEnBackend() { RegistroRequest r = valido(); r.setPassword("corta"); assertTrue(validator.validate(r).stream().anyMatch(e -> e.getPropertyPath().toString().equals("password"))); }
    @Test void exigeUniversidad() { RegistroRequest r = valido(); r.setUniversidadId(null); assertFalse(validator.validate(r).isEmpty()); }
    @Test void rechazaUnicodeExcesivo() { RegistroRequest r = valido(); r.setPassword("á".repeat(37)); assertFalse(validator.validate(r).isEmpty()); }
}
