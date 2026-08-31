package com.becas.backend.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 1 - HU-03: control de acceso mediante el filtro JWT.
 *
 * Verifica que solo un token valido autentique la peticion y que el filtro
 * nunca corte la cadena, para que Spring Security sea quien decida el 401.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthFilter - autenticacion por token en cada peticion")
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;

    private static final String CORREO = "emendezc18@miumg.edu.gt";
    private static final String TOKEN = "token.jwt.valido";

    @BeforeEach
    void inicializar() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Autentica la peticion cuando el header trae un token valido")
    void autenticaConTokenValido() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.esTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extraerCorreo(TOKEN)).thenReturn(CORREO);

        jwtAuthFilter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(CORREO);
    }

    @Test
    @DisplayName("No autentica si el token es invalido o esta vencido")
    void noAutenticaConTokenInvalido() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.esTokenValido(TOKEN)).thenReturn(false);

        jwtAuthFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtService, never()).extraerCorreo(anyString());
    }

    @Test
    @DisplayName("No autentica si la peticion no trae header Authorization")
    void noAutenticaSinHeader() throws Exception {
        jwtAuthFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("Ignora headers que no usan el esquema Bearer")
    void ignoraEsquemaDistintoDeBearer() throws Exception {
        request.addHeader("Authorization", "Basic dXN1YXJpbzpjbGF2ZQ==");

        jwtAuthFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    @DisplayName("Siempre continua la cadena de filtros, con o sin token")
    void siempreContinuaLaCadena() throws Exception {
        jwtAuthFilter.doFilter(request, response, filterChain);

        assertThat(filterChain.getRequest()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
