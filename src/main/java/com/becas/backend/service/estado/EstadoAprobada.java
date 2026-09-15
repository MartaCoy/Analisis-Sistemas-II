package com.becas.backend.service.estado;

public class EstadoAprobada implements EstadoSolicitud {
    @Override
    public String evaluar() {
        throw new IllegalStateException("La solicitud ya fue aprobada, no puede volver a evaluación.");
    }

    @Override
    public String aprobar() {
        throw new IllegalStateException("La solicitud ya está aprobada.");
    }

    @Override
    public String rechazar() {
        throw new IllegalStateException("No se puede rechazar una solicitud ya aprobada.");
    }

    @Override
    public String nombre() { return "APROBADA"; }
}