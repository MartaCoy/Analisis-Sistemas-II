package com.becas.backend.service;

import com.becas.backend.dto.ReporteBecasResponse;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.Estudiante;
import com.becas.backend.model.Evaluacion;
import com.becas.backend.model.HistorialEstadoSolicitud;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.ConvocatoriaRepository;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.repository.EvaluacionRepository;
import com.becas.backend.repository.HistorialEstadoSolicitudRepository;
import com.becas.backend.repository.SolicitudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private final SolicitudRepository solicitudRepository;
    private final EstudianteRepository estudianteRepository;
    private final ConvocatoriaRepository convocatoriaRepository;
    private final EvaluacionRepository evaluacionRepository;
    private final HistorialEstadoSolicitudRepository historialRepository;

    public ReporteService(
            SolicitudRepository solicitudRepository,
            EstudianteRepository estudianteRepository,
            ConvocatoriaRepository convocatoriaRepository,
            EvaluacionRepository evaluacionRepository,
            HistorialEstadoSolicitudRepository historialRepository
    ) {
        this.solicitudRepository = solicitudRepository;
        this.estudianteRepository = estudianteRepository;
        this.convocatoriaRepository = convocatoriaRepository;
        this.evaluacionRepository = evaluacionRepository;
        this.historialRepository = historialRepository;
    }

    @Transactional(readOnly = true)
    public ReporteBecasResponse generarReporte() {

        List<Solicitud> solicitudes = solicitudRepository.findAll();

        long aprobadas = contarEstado(solicitudes, "APROBADA");
        long rechazadas = contarEstado(solicitudes, "RECHAZADA");
        long enEvaluacion = contarEstado(solicitudes, "EN_EVALUACION");
        long recibidas = contarEstado(solicitudes, "RECIBIDA");

        ReporteBecasResponse.Resumen resumen =
                new ReporteBecasResponse.Resumen(
                        solicitudes.size(),
                        aprobadas,
                        rechazadas,
                        enEvaluacion,
                        recibidas
                );

        List<ReporteBecasResponse.EstadoCantidad> estados = List.of(
                new ReporteBecasResponse.EstadoCantidad("Aprobadas", aprobadas),
                new ReporteBecasResponse.EstadoCantidad("Rechazadas", rechazadas),
                new ReporteBecasResponse.EstadoCantidad("En evaluación", enEvaluacion),
                new ReporteBecasResponse.EstadoCantidad("Recibidas", recibidas)
        );

        List<ReporteBecasResponse.BecaOtorgada> otorgadas = new ArrayList<>();
        Map<String, Long> cantidadPorTipo = new LinkedHashMap<>();

        for (Solicitud solicitud : solicitudes) {

            if (!"APROBADA".equals(solicitud.getEstado())) {
                continue;
            }

            Estudiante estudiante = estudianteRepository.findById(
                    solicitud.getEstudianteId()
            ).orElse(null);

            Convocatoria convocatoria = convocatoriaRepository.findById(
                    solicitud.getConvocatoriaId()
            ).orElse(null);

            if (estudiante == null || convocatoria == null) {
                continue;
            }

            List<Evaluacion> evaluaciones =
                    evaluacionRepository.findBySolicitudId(solicitud.getId());

            double puntajePromedio = evaluaciones.stream()
                    .mapToInt(Evaluacion::getPuntaje)
                    .average()
                    .orElse(0.0);

            LocalDate fechaAprobacion = obtenerFechaAprobacion(solicitud);

            otorgadas.add(
                    new ReporteBecasResponse.BecaOtorgada(
                            solicitud.getId(),
                            estudiante.getNombreCompleto(),
                            convocatoria.getNombre(),
                            convocatoria.getTipoBeca(),
                            fechaAprobacion,
                            puntajePromedio,
                            solicitud.getEstado()
                    )
            );

            cantidadPorTipo.merge(
                    convocatoria.getTipoBeca(),
                    1L,
                    Long::sum
            );
        }

        otorgadas.sort(
                Comparator.comparing(
                        ReporteBecasResponse.BecaOtorgada::fecha,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
        );

        List<ReporteBecasResponse.TipoBecaCantidad> tiposBeca =
                cantidadPorTipo.entrySet()
                        .stream()
                        .map(entry ->
                                new ReporteBecasResponse.TipoBecaCantidad(
                                        entry.getKey(),
                                        entry.getValue()
                                )
                        )
                        .toList();

        return new ReporteBecasResponse(
                LocalDateTime.now(),
                resumen,
                estados,
                tiposBeca,
                otorgadas
        );
    }

    private long contarEstado(
            List<Solicitud> solicitudes,
            String estado
    ) {
        return solicitudes.stream()
                .filter(s -> estado.equals(s.getEstado()))
                .count();
    }

    private LocalDate obtenerFechaAprobacion(Solicitud solicitud) {

        List<HistorialEstadoSolicitud> historial =
                historialRepository
                        .findBySolicitudIdOrderByFechaCambioAsc(
                                solicitud.getId()
                        );

        return historial.stream()
                .filter(h -> "APROBADA".equals(h.getEstadoNuevo()))
                .map(HistorialEstadoSolicitud::getFechaCambio)
                .filter(fecha -> fecha != null)
                .map(LocalDateTime::toLocalDate)
                .findFirst()
                .orElseGet(() ->
                        solicitud.getFechaSolicitud() != null
                                ? solicitud.getFechaSolicitud().toLocalDate()
                                : null
                );
    }
}
