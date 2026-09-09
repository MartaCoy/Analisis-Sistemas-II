package com.becas.backend.model;

public class SolicitudBuilder {
    private final Solicitud solicitud = new Solicitud();

    public SolicitudBuilder estudiante(Long estudianteId) {
        solicitud.setEstudianteId(estudianteId);
        return this;
    }
    public SolicitudBuilder convocatoria(Long convocatoriaId) {
        solicitud.setConvocatoriaId(convocatoriaId);
        return this;
    }
    public SolicitudBuilder estadoInicial() {
        solicitud.setEstado("RECIBIDA");
        return this;
    }
    public Solicitud build() {
        return solicitud;
    }
}