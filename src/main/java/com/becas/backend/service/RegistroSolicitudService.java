package com.becas.backend.service;

import com.becas.backend.model.*;
import com.becas.backend.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class RegistroSolicitudService {
    private final HistorialEstadoSolicitudRepository historial;
    private final NotificacionSolicitudRepository notificaciones;
    private final AuditoriaSolicitudRepository auditoria;
    private final ApplicationEventPublisher publisher;

    public RegistroSolicitudService(HistorialEstadoSolicitudRepository historial,
        NotificacionSolicitudRepository notificaciones,
        AuditoriaSolicitudRepository auditoria,
        ApplicationEventPublisher publisher) {
        this.historial = historial;
        this.notificaciones = notificaciones;
        this.auditoria = auditoria;
        this.publisher = publisher;
    }

    @Transactional
    public void cambioEstado(Solicitud solicitud, String anterior, String actorCorreo) {
        String nuevo = solicitud.getEstado();
        if (java.util.Objects.equals(anterior, nuevo)) return;

        HistorialEstadoSolicitud movimiento = new HistorialEstadoSolicitud();
        movimiento.setSolicitudId(solicitud.getId());
        movimiento.setEstadoAnterior(anterior);
        movimiento.setEstadoNuevo(nuevo);
        movimiento.setFechaCambio(LocalDateTime.now());
        historial.save(movimiento);

        NotificacionSolicitud aviso = new NotificacionSolicitud();
        aviso.setSolicitudId(solicitud.getId());
        aviso.setEstudianteId(solicitud.getEstudianteId());
        aviso.setEstadoNuevo(nuevo);
        aviso.setMensaje("Tu solicitud #" + solicitud.getId() +
            " cambió a " + nuevo.replace('_', ' ').toLowerCase() + ".");
        notificaciones.save(aviso);

        accion(solicitud.getId(), actorCorreo, "CAMBIO_ESTADO", "EXITOSA",
            String.valueOf(anterior) + " -> " + nuevo);
        publisher.publishEvent(new SolicitudEstadoCambiadoEvent(
            solicitud.getId(), solicitud.getEstudianteId(), anterior, nuevo));
    }

    @Transactional
    public void accion(Long solicitudId, String actorCorreo, String operacion,
                       String resultado, String detalle) {
        AuditoriaSolicitud registro = new AuditoriaSolicitud();
        registro.setSolicitudId(solicitudId);
        registro.setActorCorreo(actorCorreo);
        registro.setOperacion(operacion);
        registro.setResultado(resultado);
        registro.setDetalle(detalle);
        auditoria.save(registro);
    }
}
