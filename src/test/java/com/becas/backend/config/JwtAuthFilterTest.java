package com.becas.backend.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 1 - HU-03: control de acceso por rol (RBAC) mediante el filtro JWT.
 *
 * Actualizado para la version de JwtAuthFilter que extrae el rol del token y
 * lo publica como authority ROLE_<ROL>, que es lo que habilita el uso de
 * @PreAuthorize / hasRole en los endpoints.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthFilter - autenticacion y rol en cada peticion")
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
        when(jwtService.extraerRol(TOKEN)).thenReturn("ESTUDIANTE");

        jwtAuthFilter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(CORREO);
    }

    @ParameterizedTest(name = "rol: {0}")
    @DisplayName("Publica el rol del token como authority ROLE_<ROL> (HU-03)")
    @ValueSource(strings = {"ESTUDIANTE", "EVALUADOR", "ADMINISTRADOR"})
    void publicaElRolComoAuthority(String rol) throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.esTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extraerCorreo(TOKEN)).thenReturn(CORREO);
        when(jwtService.extraerRol(TOKEN)).thenReturn(rol);

        jwtAuthFilter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_" + rol);
    }

    @Test
    @DisplayName("Un estudiante no recibe la authority de administrador")
    void noOtorgaAuthorityDeOtroRol() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.esTokenValido(TOKEN)).thenReturn(true);
        when(jwtService.extraerCorreo(TOKEN)).thenReturn(CORREO);
        when(jwtService.extraerRol(TOKEN)).thenReturn("ESTUDIANTE");

        jwtAuthFilter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .doesNotContain("ROLE_ADMINISTRADOR", "ROLE_EVALUADOR");
    }

    @Test
    @DisplayName("No autentica si el token es invalido o esta vencido")
    void noAutenticaConTokenInvalido() throws Exception {
        request.addHeader("Authorization", "Bearer " + TOKEN);
        when(jwtService.esTokenValido(TOKEN)).thenReturn(false);

        jwtAuthFilter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtService, never()).extraerCorreo(anyString());
        verify(jwtService, never()).extraerRol(anyString());
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
