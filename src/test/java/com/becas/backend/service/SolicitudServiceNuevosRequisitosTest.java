package com.becas.backend.service;

import com.becas.backend.model.*;
import com.becas.backend.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceNuevosRequisitosTest {
    @Mock SolicitudRepository solicitudes;
    @Mock ConvocatoriaRepository convocatorias;
    @Mock HistorialEstadoSolicitudRepository historial;
    @Mock AprobacionSolicitudRepository aprobaciones;
    @Mock RegistroSolicitudService registros;
    SolicitudService servicio;
    Solicitud solicitud;

    @BeforeEach
    void preparar() {
        servicio = new SolicitudService(solicitudes, convocatorias, historial, aprobaciones, registros);
        solicitud = new Solicitud();
        solicitud.setId(5L);
        solicitud.setEstudianteId(7L);
        solicitud.setEstado("EN_EVALUACION");
        solicitud.setMontoSolicitado(new BigDecimal("10000.00"));
        when(solicitudes.bloquearPorId(5L)).thenReturn(Optional.of(solicitud));
        lenient().when(solicitudes.saveAndFlush(any(Solicitud.class))).thenAnswer(inv -> inv.getArgument(0));
        autenticar("primero@becas.gt");
    }

    private void autenticar(String correo) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(correo, null,
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));
    }

    @AfterEach
    void limpiar() { SecurityContextHolder.clearContext(); }

    @Test
    void montoExactoNoRequiereSegunda() {
        Solicitud guardada = servicio.aprobar(5L);
        assertEquals("APROBADA", guardada.getEstado());
        verify(registros).cambioEstado(same(solicitud), eq("EN_EVALUACION"), eq("primero@becas.gt"));
        verify(aprobaciones).save(argThat(a -> a.getEtapa() == 1));
    }

    @Test
    void montoSuperiorQuedaPendiente() {
        solicitud.setMontoSolicitado(new BigDecimal("10000.01"));
        Solicitud guardada = servicio.aprobar(5L);
        assertEquals("PENDIENTE_SEGUNDA_APROBACION", guardada.getEstado());
        verify(aprobaciones, times(1)).save(any(AprobacionSolicitud.class));
    }

    @Test
    void sinMontoSeBloqueaAprobacion() {
        solicitud.setMontoSolicitado(null);
        assertThrows(IllegalStateException.class, () -> servicio.aprobar(5L));
        verify(aprobaciones, never()).save(any());
    }

    @Test
    void mismoUsuarioNoPuedeDarSegunda() {
        solicitud.setEstado("PENDIENTE_SEGUNDA_APROBACION");
        solicitud.setMontoSolicitado(new BigDecimal("12000.00"));
        AprobacionSolicitud primera = new AprobacionSolicitud();
        primera.setEtapa(1); primera.setActorCorreo("primero@becas.gt");
        when(aprobaciones.findBySolicitudIdAndEtapa(5L, 1)).thenReturn(Optional.of(primera));
        assertThrows(IllegalStateException.class,
            () -> servicio.resolverSegundaAprobacion(5L, true, "Validada"));
        verify(aprobaciones, never()).save(any());
    }

    @Test
    void segundoUsuarioAutoriza() {
        solicitud.setEstado("PENDIENTE_SEGUNDA_APROBACION");
        solicitud.setMontoSolicitado(new BigDecimal("12000.00"));
        AprobacionSolicitud primera = new AprobacionSolicitud();
        primera.setEtapa(1); primera.setActorCorreo("primero@becas.gt");
        when(aprobaciones.findBySolicitudIdAndEtapa(5L, 1)).thenReturn(Optional.of(primera));
        autenticar("segundo@becas.gt");
        Solicitud guardada = servicio.resolverSegundaAprobacion(5L, true, "Conforme");
        assertEquals("APROBADA", guardada.getEstado());
        verify(aprobaciones).save(argThat(a -> a.getEtapa() == 2 &&
            "segundo@becas.gt".equals(a.getActorCorreo())));
    }

    @Test
    void segundaDecisionNegativaDejaRechazada() {
        solicitud.setEstado("PENDIENTE_SEGUNDA_APROBACION");
        solicitud.setMontoSolicitado(new BigDecimal("12000.00"));
        AprobacionSolicitud primera = new AprobacionSolicitud();
        primera.setEtapa(1); primera.setActorCorreo("primero@becas.gt");
        when(aprobaciones.findBySolicitudIdAndEtapa(5L, 1)).thenReturn(Optional.of(primera));
        autenticar("segundo@becas.gt");
        Solicitud guardada = servicio.resolverSegundaAprobacion(5L, false, "No cumple el criterio");
        assertEquals("RECHAZADA", guardada.getEstado());
        verify(aprobaciones).save(argThat(a -> a.getEtapa() == 2 && "RECHAZADA".equals(a.getDecision())));
        verify(registros).accion(eq(5L), eq("segundo@becas.gt"), eq("SEGUNDA_APROBACION_RECHAZADA"), eq("EXITOSA"), contains("No cumple"));
        verify(registros).cambioEstado(same(solicitud), eq("PENDIENTE_SEGUNDA_APROBACION"), eq("segundo@becas.gt"));
    }

    @Test
    void montoInferiorNoRequiereSegunda() {
        solicitud.setMontoSolicitado(new BigDecimal("9999.99"));
        assertEquals("APROBADA", servicio.aprobar(5L).getEstado());
    }

    @Test
    void cambioMontoDejaAuditoriaAntesDeAprobar() {
        servicio.actualizarMonto(5L, new BigDecimal("10001.00"));
        verify(registros).accion(eq(5L), eq("primero@becas.gt"), eq("MODIFICACION_MONTO"), eq("EXITOSA"), contains("10001.00"));
    }

    @Test
    void montoNoSeModificaTrasPrimeraAprobacion() {
        solicitud.setEstado("PENDIENTE_SEGUNDA_APROBACION");
        assertThrows(IllegalStateException.class, () -> servicio.actualizarMonto(5L, new BigDecimal("9000.00")));
        verify(registros, never()).accion(any(), any(), any(), any(), any());
    }

    @Test
    void rechazoEnEvaluacionRegistraActorYCambio() {
        assertEquals("RECHAZADA", servicio.rechazar(5L).getEstado());
        verify(registros).accion(eq(5L), eq("primero@becas.gt"), eq("RECHAZO_SOLICITUD"), eq("EXITOSA"), anyString());
        verify(registros).cambioEstado(same(solicitud), eq("EN_EVALUACION"), eq("primero@becas.gt"));
    }
}
