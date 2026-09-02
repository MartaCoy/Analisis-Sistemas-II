package com.becas.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 1 - Pruebas unitarias del emisor/validador de tokens JWT.
 *
 * Archivo fusionado: conserva la cobertura de la version anterior de main
 * (generar token, extraer correo, extraer rol, token invalido) y agrega
 * casos de borde y de seguridad.
 *
 * Aqui NO se usan mocks: JwtService no tiene dependencias externas, asi que
 * se prueba la clase real. El secret se inyecta manualmente porque ahora
 * viene de una variable de entorno (JWT_SECRET) en produccion.
 */
@DisplayName("JwtService - emision y validacion de tokens")
class JwtServiceTest {

    private JwtService jwtService;

    private static final String CORREO = "emendezc18@miumg.edu.gt";

    @BeforeEach
    void inicializar() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecretString", "test-secret-key-para-pruebas-unitarias-2026");
    }

    // ------------------------------------------------------------------
    // Emision
    // ------------------------------------------------------------------

    @Test
    @DisplayName("Genera un token con las tres partes del formato JWT")
    void generaTokenConFormatoValido() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("Un token recien emitido se considera valido")
    void tokenRecienEmitidoEsValido() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(jwtService.esTokenValido(token)).isTrue();
    }

    @Test
    @DisplayName("Dos correos distintos producen tokens distintos")
    void tokensDistintosPorUsuario() {
        String tokenEdwin = jwtService.generarToken(CORREO, "ESTUDIANTE");
        String tokenMarta = jwtService.generarToken("mcoys2@miumg.edu.gt", "ESTUDIANTE");

        assertThat(tokenEdwin).isNotEqualTo(tokenMarta);
        assertThat(jwtService.extraerCorreo(tokenMarta)).isEqualTo("mcoys2@miumg.edu.gt");
    }

    // ------------------------------------------------------------------
    // Lectura de claims
    // ------------------------------------------------------------------

    @Test
    @DisplayName("El correo puede recuperarse intacto desde el token emitido")
    void recuperaElCorreoDelToken() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(jwtService.extraerCorreo(token)).isEqualTo(CORREO);
    }

    @Test
    @DisplayName("El rol puede recuperarse intacto desde el token emitido")
    void recuperaElRolDelToken() {
        String token = jwtService.generarToken("ssalama@miumg.edu.gt", "ADMINISTRADOR");

        assertThat(jwtService.extraerRol(token)).isEqualTo("ADMINISTRADOR");
    }

    @ParameterizedTest(name = "rol: {0}")
    @DisplayName("Emite y recupera correctamente los tres roles del sistema (HU-03)")
    @ValueSource(strings = {"ESTUDIANTE", "EVALUADOR", "ADMINISTRADOR"})
    void emiteYRecuperaCadaRol(String rol) {
        String token = jwtService.generarToken(CORREO, rol);

        assertThat(jwtService.esTokenValido(token)).isTrue();
        assertThat(jwtService.extraerCorreo(token)).isEqualTo(CORREO);
        assertThat(jwtService.extraerRol(token)).isEqualTo(rol);
    }

    @Test
    @DisplayName("El rol de un token no se confunde con el de otro")
    void noMezclaRolesEntreTokens() {
        String tokenEstudiante = jwtService.generarToken(CORREO, "ESTUDIANTE");
        String tokenAdmin = jwtService.generarToken(CORREO, "ADMINISTRADOR");

        assertThat(jwtService.extraerRol(tokenEstudiante)).isEqualTo("ESTUDIANTE");
        assertThat(jwtService.extraerRol(tokenAdmin)).isEqualTo("ADMINISTRADOR");
    }

    // ------------------------------------------------------------------
    // Seguridad
    // ------------------------------------------------------------------

    @Test
    @DisplayName("Rechaza un token cuya firma fue alterada")
    void rechazaTokenAlterado() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");
        String alterado = token.substring(0, token.length() - 4) + "AAAA";

        assertThat(jwtService.esTokenValido(alterado)).isFalse();
    }

    @Test
    @DisplayName("Rechaza un token cuyo payload fue manipulado para escalar rol")
    void rechazaPayloadManipulado() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");
        String[] partes = token.split("\\.");

        String payloadFalso = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"" + CORREO + "\",\"rol\":\"ADMINISTRADOR\"}").getBytes());
        String tokenFalsificado = partes[0] + "." + payloadFalso + "." + partes[2];

        assertThat(jwtService.esTokenValido(tokenFalsificado)).isFalse();
    }

    @ParameterizedTest(name = "entrada invalida: \"{0}\"")
    @DisplayName("Rechaza cadenas que no son tokens sin lanzar excepcion")
    @ValueSource(strings = {"", "   ", "token-falso-que-no-existe", "a.b.c", "Bearer algo"})
    void rechazaCadenasQueNoSonTokens(String entrada) {
        assertThat(jwtService.esTokenValido(entrada)).isFalse();
    }

    @Test
    @DisplayName("Extraer el correo de un token invalido lanza excepcion")
    void extraerCorreoDeTokenInvalidoFalla() {
        assertThatThrownBy(() -> jwtService.extraerCorreo("token-invalido"))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("Extraer el rol de un token invalido lanza excepcion")
    void extraerRolDeTokenInvalidoFalla() {
        assertThatThrownBy(() -> jwtService.extraerRol("token-invalido"))
                .isInstanceOf(Exception.class);
    }
}