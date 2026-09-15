package com.becas.backend.service.estado;

public interface EstadoSolicitud {
    String evaluar();
    String aprobar();
    String rechazar();
    String nombre();
}