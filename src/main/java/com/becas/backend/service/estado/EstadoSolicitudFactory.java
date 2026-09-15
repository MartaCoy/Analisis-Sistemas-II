package com.becas.backend.service.estado;

public class EstadoSolicitudFactory {

    public static EstadoSolicitud obtener(String estado) {
        return switch (estado) {
            case "RECIBIDA" -> new EstadoRecibida();
            case "EN_EVALUACION" -> new EstadoEnEvaluacion();
            case "APROBADA" -> new EstadoAprobada();
            case "RECHAZADA" -> new EstadoRechazada();
            default -> throw new IllegalArgumentException("Estado desconocido: " + estado);
        };
    }
}