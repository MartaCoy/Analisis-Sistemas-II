package com.becas.backend.service.estado;

public class EstadoPendienteSegundaAprobacion implements EstadoSolicitud {
    @Override public String evaluar() {
        throw new IllegalStateException("La evaluación del comité ya terminó.");
    }
    @Override public String aprobar() { return "APROBADA"; }
    @Override public String rechazar() { return "RECHAZADA"; }
    @Override public String nombre() { return "PENDIENTE_SEGUNDA_APROBACION"; }
}
