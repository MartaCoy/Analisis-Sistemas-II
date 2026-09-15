package com.becas.backend.service.estado;

public class EstadoRecibida implements EstadoSolicitud {
    @Override
    public String evaluar() { return "EN_EVALUACION"; }

    @Override
    public String aprobar() {
        throw new IllegalStateException("No se puede aprobar una solicitud que aún no está en evaluación.");
    }

    @Override
    public String rechazar() {
        throw new IllegalStateException("No se puede rechazar una solicitud que aún no está en evaluación.");
    }

    @Override
    public String nombre() { return "RECIBIDA"; }
}