package com.becas.backend.controller;

import com.becas.backend.config.JwtService;
import com.becas.backend.dto.AuthResponse;
import com.becas.backend.dto.LoginRequest;
import com.becas.backend.dto.RegistroRequest;
import com.becas.backend.model.Estudiante;
import com.becas.backend.repository.EstudianteRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 1 - HU-01 / HU-02 / HU-03: registro, login y control de roles.
 *
 * Pruebas unitarias del servicio de autenticacion. El repositorio, el
 * PasswordEncoder y el JwtService se sustituyen por dobles de prueba
 * (Mockito), por lo que estas pruebas NO levantan el contexto de Spring
 * ni requieren PostgreSQL: corren en milisegundos y son deterministas.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController - registro, login y rol asignado")
class AuthControllerTest {

    @Mock
    private EstudianteRepository estudianteRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController authController;

    private static final String CORREO = "emendezc18@miumg.edu.gt";
    private static final String PASSWORD_PLANA = "Sencam2026";
    private static final String PASSWORD_HASH = "$2a$10$hashBcryptSimuladoParaPruebas";
    private static final String TOKEN = "eyJhbGciOiJIUzI1NiJ9.token.simulado";

    private RegistroRequest registroRequest;
    private LoginRequest loginRequest;
    private Estudiante estudianteGuardado;

    @BeforeEach
    void prepararDatos() {
        registroRequest = new RegistroRequest();
        registroRequest.setNombreCompleto("Edwin Daniel Mendez Castro");
        registroRequest.setCorreo(CORREO);
        registroRequest.setPassword(PASSWORD_PLANA);
        registroRequest.setCarnet("1990-21-12345");

        loginRequest = new LoginRequest();
        loginRequest.setCorreo(CORREO);
        loginRequest.setPassword(PASSWORD_PLANA);

        estudianteGuardado = new Estudiante();
        estudianteGuardado.setId(1L);
        estudianteGuardado.setNombreCompleto("Edwin Daniel Mendez Castro");
        estudianteGuardado.setCorreo(CORREO);
        estudianteGuardado.setPassword(PASSWORD_HASH);
        estudianteGuardado.setCarnet("1990-21-12345");
        estudianteGuardado.setRol("ESTUDIANTE");
    }

    // ==================================================================
    // REGISTRO
    // ==================================================================

    @Nested
    @DisplayName("Registro de estudiantes")
    class Registro {

        @Test
        @DisplayName("Devuelve 200 y un token cuando el correo aun no existe")
        void registraEstudianteNuevo() {
            when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(PASSWORD_PLANA)).thenReturn(PASSWORD_HASH);
            when(estudianteRepository.save(any(Estudiante.class))).thenReturn(estudianteGuardado);
            when(jwtService.generarToken(CORREO, "ESTUDIANTE")).thenReturn(TOKEN);

            ResponseEntity<?> respuesta = authController.registrar(registroRequest);

            assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(respuesta.getBody()).isInstanceOf(AuthResponse.class);

            AuthResponse cuerpo = (AuthResponse) respuesta.getBody();
            assertThat(cuerpo.getToken()).isEqualTo(TOKEN);
            assertThat(cuerpo.getCorreo()).isEqualTo(CORREO);
            assertThat(cuerpo.getNombreCompleto()).isEqualTo("Edwin Daniel Mendez Castro");

            verify(estudianteRepository).save(any(Estudiante.class));
        }

        @Test
        @DisplayName("Persiste la contrasena encriptada, nunca en texto plano")
        void nuncaGuardaLaContrasenaEnTextoPlano() {
            when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(PASSWORD_PLANA)).thenReturn(PASSWORD_HASH);
            when(estudianteRepository.save(any(Estudiante.class))).thenReturn(estudianteGuardado);
            when(jwtService.generarToken(anyString(), anyString())).thenReturn(TOKEN);

            authController.registrar(registroRequest);

            ArgumentCaptor<Estudiante> captor = ArgumentCaptor.forClass(Estudiante.class);
            verify(estudianteRepository).save(captor.capture());

            Estudiante persistido = captor.getValue();
            assertThat(persistido.getPassword())
                    .isEqualTo(PASSWORD_HASH)
                    .isNotEqualTo(PASSWORD_PLANA);
            verify(passwordEncoder).encode(PASSWORD_PLANA);
        }

        @Test
        @DisplayName("Copia correctamente nombre, correo y carnet del request a la entidad")
        void mapeaLosDatosDelRequest() {
            when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn(PASSWORD_HASH);
            when(estudianteRepository.save(any(Estudiante.class))).thenReturn(estudianteGuardado);
            when(jwtService.generarToken(anyString(), anyString())).thenReturn(TOKEN);

            authController.registrar(registroRequest);

            ArgumentCaptor<Estudiante> captor = ArgumentCaptor.forClass(Estudiante.class);
            verify(estudianteRepository).save(captor.capture());

            Estudiante persistido = captor.getValue();
            assertThat(persistido.getNombreCompleto()).isEqualTo("Edwin Daniel Mendez Castro");
            assertThat(persistido.getCorreo()).isEqualTo(CORREO);
            assertThat(persistido.getCarnet()).isEqualTo("1990-21-12345");
        }

        @Test
        @DisplayName("Todo registro publico nace con rol ESTUDIANTE (HU-03)")
        void asignaRolEstudiantePorDefecto() {
            when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn(PASSWORD_HASH);
            when(estudianteRepository.save(any(Estudiante.class))).thenReturn(estudianteGuardado);
            when(jwtService.generarToken(anyString(), anyString())).thenReturn(TOKEN);

            authController.registrar(registroRequest);

            ArgumentCaptor<Estudiante> captor = ArgumentCaptor.forClass(Estudiante.class);
            verify(estudianteRepository).save(captor.capture());
            assertThat(captor.getValue().getRol()).isEqualTo("ESTUDIANTE");

            // El rol tambien debe viajar dentro del token emitido.
            verify(jwtService).generarToken(CORREO, "ESTUDIANTE");
        }

        @Test
        @DisplayName("Devuelve 400 y no guarda nada si el correo ya esta registrado")
        void rechazaCorreoDuplicado() {
            when(estudianteRepository.findByCorreo(CORREO))
                    .thenReturn(Optional.of(estudianteGuardado));

            ResponseEntity<?> respuesta = authController.registrar(registroRequest);

            assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(estudianteRepository, never()).save(any(Estudiante.class));
            verifyNoInteractions(passwordEncoder, jwtService);
        }
    }

    // ==================================================================
    // LOGIN
    // ==================================================================

    @Nested
    @DisplayName("Inicio de sesion")
    class Login {

        @Test
        @DisplayName("Devuelve 200 con token y rol cuando las credenciales son correctas")
        void loginExitoso() {
            when(estudianteRepository.findByCorreo(CORREO))
                    .thenReturn(Optional.of(estudianteGuardado));
            when(passwordEncoder.matches(PASSWORD_PLANA, PASSWORD_HASH)).thenReturn(true);
            when(jwtService.generarToken(CORREO, "ESTUDIANTE")).thenReturn(TOKEN);

            ResponseEntity<?> respuesta = authController.login(loginRequest);

            assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.OK);

            AuthResponse cuerpo = (AuthResponse) respuesta.getBody();
            assertThat(cuerpo.getToken()).isEqualTo(TOKEN);
            assertThat(cuerpo.getRol()).isEqualTo("ESTUDIANTE");
            assertThat(cuerpo.getCorreo()).isEqualTo(CORREO);
        }

        @Test
        @DisplayName("El token emitido lleva el rol real del estudiante, no uno fijo (HU-03)")
        void emiteTokenConElRolDelEvaluador() {
            estudianteGuardado.setRol("EVALUADOR");

            when(estudianteRepository.findByCorreo(CORREO))
                    .thenReturn(Optional.of(estudianteGuardado));
            when(passwordEncoder.matches(PASSWORD_PLANA, PASSWORD_HASH)).thenReturn(true);
            when(jwtService.generarToken(CORREO, "EVALUADOR")).thenReturn(TOKEN);

            ResponseEntity<?> respuesta = authController.login(loginRequest);

            AuthResponse cuerpo = (AuthResponse) respuesta.getBody();
            assertThat(cuerpo.getRol()).isEqualTo("EVALUADOR");
            verify(jwtService).generarToken(CORREO, "EVALUADOR");
        }

        @Test
        @DisplayName("Devuelve 401 si la contrasena no coincide")
        void rechazaPasswordIncorrecta() {
            loginRequest.setPassword("claveEquivocada");

            when(estudianteRepository.findByCorreo(CORREO))
                    .thenReturn(Optional.of(estudianteGuardado));
            when(passwordEncoder.matches("claveEquivocada", PASSWORD_HASH)).thenReturn(false);

            ResponseEntity<?> respuesta = authController.login(loginRequest);

            assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verifyNoInteractions(jwtService);
        }

        @Test
        @DisplayName("Devuelve 401 si el correo no existe, sin emitir token")
        void rechazaCorreoInexistente() {
            loginRequest.setCorreo("noexiste@miumg.edu.gt");
            when(estudianteRepository.findByCorreo("noexiste@miumg.edu.gt"))
                    .thenReturn(Optional.empty());

            ResponseEntity<?> respuesta = authController.login(loginRequest);

            assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verifyNoInteractions(jwtService, passwordEncoder);
        }

        @Test
        @DisplayName("El mensaje de error no revela si fallo el correo o la contrasena")
        void mensajeDeErrorNoFiltraInformacion() {
            when(estudianteRepository.findByCorreo(CORREO))
                    .thenReturn(Optional.of(estudianteGuardado));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            ResponseEntity<?> conPasswordMala = authController.login(loginRequest);

            reset(estudianteRepository);
            when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.empty());

            ResponseEntity<?> conCorreoInexistente = authController.login(loginRequest);

            assertThat(conPasswordMala.getBody())
                    .isEqualTo(conCorreoInexistente.getBody());
        }
    }
}
