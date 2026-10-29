package com.becas.backend.controller;

import com.becas.backend.config.JwtService;
import com.becas.backend.dto.LoginRequest;
import com.becas.backend.repository.EstudianteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthMensajesTest {
    @Mock EstudianteRepository estudiantes;
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwt;
    @InjectMocks AuthController controller;
    @Test void longitudExcesivaNoExponeExcepcionBcrypt() {
        LoginRequest r = new LoginRequest(); r.setCorreo("persona@example.com"); r.setPassword("a".repeat(73));
        var respuesta = controller.login(r);
        assertEquals(401, respuesta.getStatusCode().value());
        assertEquals("Correo o contraseña incorrectos.", respuesta.getBody());
        verifyNoInteractions(estudiantes, encoder, jwt);
    }
    @Test void respuestaDeFormatoNoIncluyeDetallesInternos() {
        var respuesta = new AuthExceptionHandler().formato();
        assertEquals(400, respuesta.getStatusCode().value());
        assertFalse(respuesta.getBody().containsKey("trace"));
        assertFalse(respuesta.getBody().containsKey("password"));
    }
}
