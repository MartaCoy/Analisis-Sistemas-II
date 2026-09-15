package com.becas.backend.service.estado;

public class EstadoEnEvaluacion implements EstadoSolicitud {
    @Override
    public String evaluar() {
        throw new IllegalStateException("La solicitud ya está en evaluación.");
    }

    @Override
    public String aprobar() { return "APROBADA"; }

    @Override
    public String rechazar() { return "RECHAZADA"; }

    @Override
    public String nombre() { return "EN_EVALUACION"; }
}