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
}