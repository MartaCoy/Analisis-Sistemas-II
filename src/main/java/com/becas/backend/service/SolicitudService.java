package com.becas.backend.service;

import com.becas.backend.dto.SolicitudRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.Solicitud;
import com.becas.backend.model.SolicitudBuilder;
import com.becas.backend.repository.ConvocatoriaRepository;
import com.becas.backend.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SolicitudService {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private ConvocatoriaRepository convocatoriaRepository;
    
    @Autowired
    private com.becas.backend.repository.HistorialEstadoSolicitudRepository historialRepository;

    public List<Solicitud> listarPorEstudiante(Long estudianteId) {
        return solicitudRepository.findByEstudianteId(estudianteId);
    }

    public Solicitud crear(Long estudianteId, SolicitudRequest request) {
        Convocatoria convocatoria = convocatoriaRepository.findById(request.getConvocatoriaId())
                .orElseThrow(() -> new IllegalArgumentException("La convocatoria no existe."));

        if (!"PUBLICADA".equals(convocatoria.getEstado())) {
            throw new IllegalStateException("La convocatoria no está abierta para recibir solicitudes.");
        }

        if (solicitudRepository.findByEstudianteIdAndConvocatoriaId(
                estudianteId, request.getConvocatoriaId()).isPresent()) {
            throw new IllegalStateException("Ya existe una solicitud para esta convocatoria.");
        }

        Solicitud solicitud = new SolicitudBuilder()
                .estudiante(estudianteId)
                .convocatoria(request.getConvocatoriaId())
                .estadoInicial()
                .build();

        return solicitudRepository.save(solicitud);
    }

    public Solicitud obtener(Long id) {
        return solicitudRepository.findById(id).orElse(null);
    }
    @org.springframework.transaction.annotation.Transactional
    public Solicitud evaluar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::evaluar);
    }

    @org.springframework.transaction.annotation.Transactional
    public Solicitud aprobar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::aprobar);
    }

    @org.springframework.transaction.annotation.Transactional
    public Solicitud rechazar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::rechazar);
    }

    private Solicitud cambiarEstado(
            Long id,
            java.util.function.Function<com.becas.backend.service.estado.EstadoSolicitud, String> transicion) {

        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));

        String estadoAnterior = solicitud.getEstado();

        com.becas.backend.service.estado.EstadoSolicitud estadoActual =
                com.becas.backend.service.estado.EstadoSolicitudFactory.obtener(estadoAnterior);

        String nuevoEstado = transicion.apply(estadoActual);

        solicitud.setEstado(nuevoEstado);
        Solicitud guardada = solicitudRepository.save(solicitud);

        com.becas.backend.model.HistorialEstadoSolicitud historial =
                new com.becas.backend.model.HistorialEstadoSolicitud();

        historial.setSolicitudId(guardada.getId());
        historial.setEstadoAnterior(estadoAnterior);
        historial.setEstadoNuevo(nuevoEstado);
        historial.setFechaCambio(java.time.LocalDateTime.now());

        historialRepository.save(historial);

        return guardada;
    }
    public Solicitud asignarComite(Long id, Long comiteId) {
        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));
        solicitud.setComiteId(comiteId);
        return solicitudRepository.save(solicitud);
    }
    
    public List<com.becas.backend.model.HistorialEstadoSolicitud> obtenerHistorial(Long solicitudId) {
        return historialRepository.findBySolicitudIdOrderByFechaCambioAsc(solicitudId);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Solicitud> listarAsignadasParaEvaluador(Long evaluadorId) {
        return solicitudRepository.listarAsignadasParaEvaluador(evaluadorId);
    }
}
