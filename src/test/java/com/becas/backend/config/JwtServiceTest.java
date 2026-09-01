package com.becas.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecretString", "test-secret-key-para-pruebas-unitarias-2026");
    }

    @Test
    void generarToken_deberiaCrearUnTokenValido() {
        String token = jwtService.generarToken("test@umg.edu.gt", "ESTUDIANTE");
        assertNotNull(token);
        assertTrue(jwtService.esTokenValido(token));
    }

    @Test
    void extraerCorreo_deberiaDevolverElCorreoCorrecto() {
        String token = jwtService.generarToken("sergio@umg.edu.gt", "ADMINISTRADOR");
        String correo = jwtService.extraerCorreo(token);
        assertEquals("sergio@umg.edu.gt", correo);
    }

    @Test
    void extraerRol_deberiaDevolverElRolCorrecto() {
        String token = jwtService.generarToken("sergio@umg.edu.gt", "ADMINISTRADOR");
        String rol = jwtService.extraerRol(token);
        assertEquals("ADMINISTRADOR", rol);
    }

    @Test
    void esTokenValido_deberiaFallarConTokenInvalido() {
        boolean esValido = jwtService.esTokenValido("token-falso-que-no-existe");
        assertFalse(esValido);
    }
}