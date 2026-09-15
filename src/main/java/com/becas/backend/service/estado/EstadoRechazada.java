package com.becas.backend.service.estado;

public class EstadoRechazada implements EstadoSolicitud {
    @Override
    public String evaluar() {
        throw new IllegalStateException("La solicitud ya fue rechazada, no puede volver a evaluación.");
    }

    @Override
    public String aprobar() {
        throw new IllegalStateException("No se puede aprobar una solicitud ya rechazada.");
    }

    @Override
    public String rechazar() {
        throw new IllegalStateException("La solicitud ya está rechazada.");
    }

    @Override
    public String nombre() { return "RECHAZADA"; }
}