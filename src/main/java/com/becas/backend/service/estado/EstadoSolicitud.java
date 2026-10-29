package com.becas.backend.service.estado;

public interface EstadoSolicitud {
    String evaluar();
    String aprobar();
    String rechazar();
    default String solicitarSegundaAprobacion() {
        throw new IllegalStateException("No se permite solicitar segunda aprobación en este estado.");
    }
    String nombre();
}