package com.becas.backend.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificacionListener {

    @EventListener
    public void alResolverseSolicitud(SolicitudResueltaEvent evento) {
        System.out.println("[NOTIFICACION] Solicitud " + evento.solicitudId()
                + " del estudiante " + evento.estudianteId()
                + " quedó " + evento.estadoFinal()
                + ". Se enviaría notificación al estudiante.");
    }
}