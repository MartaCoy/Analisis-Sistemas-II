package com.becas.backend.service;

import com.becas.backend.model.*;
import com.becas.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RegistroSolicitudServiceTest {
    @Mock HistorialEstadoSolicitudRepository historial;
    @Mock NotificacionSolicitudRepository notificaciones;
    @Mock AuditoriaSolicitudRepository auditoria;
    @Mock ApplicationEventPublisher publicador;

    @Test
    void cadaTransicionGuardaHistorialNotificacionYAuditoria() {
        var servicio = new RegistroSolicitudService(historial, notificaciones, auditoria, publicador);
        Solicitud s = new Solicitud();
        s.setId(1L); s.setEstudianteId(20L); s.setEstado("EN_EVALUACION");
        servicio.cambioEstado(s, "RECIBIDA", "admin@becas.gt");
        verify(historial).save(any(HistorialEstadoSolicitud.class));
        var aviso = ArgumentCaptor.forClass(NotificacionSolicitud.class);
        verify(notificaciones).save(aviso.capture());
        assertEquals(20L, aviso.getValue().getEstudianteId());
        assertEquals("EN_EVALUACION", aviso.getValue().getEstadoNuevo());
        verify(auditoria).save(any(AuditoriaSolicitud.class));
        verify(publicador).publishEvent(any(SolicitudEstadoCambiadoEvent.class));
    }

    @Test
    void sinCambioNoGeneraEventoNiAviso() {
        var servicio = new RegistroSolicitudService(historial, notificaciones, auditoria, publicador);
        Solicitud s = new Solicitud();
        s.setId(1L); s.setEstudianteId(20L); s.setEstado("RECIBIDA");
        servicio.cambioEstado(s, "RECIBIDA", "admin@becas.gt");
        verifyNoInteractions(historial, notificaciones, auditoria, publicador);
    }
}
