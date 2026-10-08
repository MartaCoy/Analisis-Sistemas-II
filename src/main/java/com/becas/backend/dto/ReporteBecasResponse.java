package com.becas.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReporteBecasResponse(
        LocalDateTime generadoEn,
        Resumen resumen,
        List<EstadoCantidad> estados,
        List<TipoBecaCantidad> tiposBeca,
        List<BecaOtorgada> otorgadas
) {

    public record Resumen(
            long totalSolicitudes,
            long aprobadas,
            long rechazadas,
            long enEvaluacion,
            long recibidas
    ) {}

    public record EstadoCantidad(
            String nombre,
            long cantidad
    ) {}

    public record TipoBecaCantidad(
            String nombre,
            long cantidad
    ) {}

    public record BecaOtorgada(
            Long id,
            String estudiante,
            String convocatoria,
            String tipoBeca,
            LocalDate fecha,
            double puntaje,
            String estado
    ) {}
}
