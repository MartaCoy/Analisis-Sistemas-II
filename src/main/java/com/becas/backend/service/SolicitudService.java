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
    public Solicitud evaluar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::evaluar);
    }

    public Solicitud aprobar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::aprobar);
    }

    public Solicitud rechazar(Long id) {
        return cambiarEstado(id, com.becas.backend.service.estado.EstadoSolicitud::rechazar);
    }

    private Solicitud cambiarEstado(Long id, java.util.function.Function<com.becas.backend.service.estado.EstadoSolicitud, String> transicion) {
        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));

        com.becas.backend.service.estado.EstadoSolicitud estadoActual =
                com.becas.backend.service.estado.EstadoSolicitudFactory.obtener(solicitud.getEstado());

        String nuevoEstado = transicion.apply(estadoActual);
        solicitud.setEstado(nuevoEstado);
        return solicitudRepository.save(solicitud);
    }
    public Solicitud asignarComite(Long id, Long comiteId) {
        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));
        solicitud.setComiteId(comiteId);
        return solicitudRepository.save(solicitud);
    }
}