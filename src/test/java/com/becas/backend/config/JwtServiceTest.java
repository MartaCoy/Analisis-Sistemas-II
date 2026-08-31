package com.becas.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 1 - Pruebas unitarias del emisor/validador de tokens JWT.
 *
 * Aqui NO se usan mocks: JwtService no tiene dependencias externas, asi que
 * se prueba la clase real. Se valida el ciclo completo firmar -> leer ->
 * verificar, que es la base de la autenticacion de todo el sistema.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@DisplayName("JwtService - emision y validacion de tokens")
class JwtServiceTest {

    private JwtService jwtService;

    private static final String CORREO = "emendezc18@miumg.edu.gt";

    @BeforeEach
    void inicializar() {
        jwtService = new JwtService();
    }

    @Test
    @DisplayName("Genera un token con las tres partes del formato JWT")
    void generaTokenConFormatoValido() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("El correo puede recuperarse intacto desde el token emitido")
    void recuperaElCorreoDelToken() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(jwtService.extraerCorreo(token)).isEqualTo(CORREO);
    }

    @Test
    @DisplayName("Un token recien emitido se considera valido")
    void tokenRecienEmitidoEsValido() {
        String token = jwtService.generarToken(CORREO, "ESTUDIANTE");

        assertThat(jwtService.esTokenValido(token)).isTrue();
    }

    @ParameterizedTest(name = "rol: {0}")
    @DisplayName("Emite tokens para los tres roles del sistema (HU-03)")
    @ValueSource(strings = {"ESTUDIANTE", "EVALUADOR", "ADMINISTRADOR"})
    void emiteTokenParaCadaRol(String rol) {
        String token = jwtService.generarToken(CORREO, rol);

        assertThat(jwtService.esTokenValido(token)).isTrue();
        assertThat(jwtService.extraerCorreo(token)).isEqualTo(CORREO);
    }

    @Test
    @DisplayName("Dos correos distintos producen tokens distintos")
    void tokensDistintosPorUsuario() {
        String tokenEdwin = jwtService.generarToken(CORREO, "ESTUDIANTE");
        String tokenMarta = jwtService.generarToken("mcoys2@miumg.edu.gt", "ESTUDIANTE");

        assertThat(tokenEdwin).isNotEqualTo(tokenMarta);
        assertThat(jwtService.extraerCorreo(tokenMarta)).isEqualTo("mcoys2@miumg.edu.gt");
    }

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

        // Se sustituye el payload por otro valido en base64 pero no firmado.
        String payloadFalso = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"" + CORREO + "\",\"rol\":\"ADMINISTRADOR\"}").getBytes());
        String tokenFalsificado = partes[0] + "." + payloadFalso + "." + partes[2];

        assertThat(jwtService.esTokenValido(tokenFalsificado)).isFalse();
    }

    @ParameterizedTest(name = "entrada invalida: \"{0}\"")
    @DisplayName("Rechaza cadenas que no son tokens sin lanzar excepcion")
    @ValueSource(strings = {"", "   ", "token-invalido", "a.b.c", "Bearer algo"})
    void rechazaCadenasQueNoSonTokens(String entrada) {
        assertThat(jwtService.esTokenValido(entrada)).isFalse();
    }

    @Test
    @DisplayName("Extraer el correo de un token invalido lanza excepcion")
    void extraerCorreoDeTokenInvalidoFalla() {
        assertThatThrownBy(() -> jwtService.extraerCorreo("token-invalido"))
                .isInstanceOf(Exception.class);
    }
}
