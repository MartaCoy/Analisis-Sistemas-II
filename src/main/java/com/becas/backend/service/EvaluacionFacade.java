package com.becas.backend.service;

import com.becas.backend.dto.EvaluacionRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.Estudiante;
import com.becas.backend.model.Evaluacion;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.ComiteMiembroRepository;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.repository.EvaluacionRepository;
import com.becas.backend.service.criterio.CriterioEvaluacion;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
public class EvaluacionFacade {

    private final SolicitudService solicitudService;
    private final ConvocatoriaService convocatoriaService;
    private final EvaluacionRepository evaluacionRepository;
    private final ComiteMiembroRepository comiteMiembroRepository;
    private final EstudianteRepository estudianteRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Map<String, CriterioEvaluacion> criterios;

    public EvaluacionFacade(SolicitudService solicitudService,
                            ConvocatoriaService convocatoriaService,
                            EvaluacionRepository evaluacionRepository,
                            ComiteMiembroRepository comiteMiembroRepository,
                            EstudianteRepository estudianteRepository,
                            ApplicationEventPublisher eventPublisher,
                            List<CriterioEvaluacion> listaCriterios) {
        this.solicitudService = solicitudService;
        this.convocatoriaService = convocatoriaService;
        this.evaluacionRepository = evaluacionRepository;
        this.comiteMiembroRepository = comiteMiembroRepository;
        this.estudianteRepository = estudianteRepository;
        this.eventPublisher = eventPublisher;
        this.criterios = listaCriterios.stream()
                .collect(Collectors.toMap(CriterioEvaluacion::tipoBeca, Function.identity()));
    }

    @Transactional
    public Evaluacion evaluar(Long solicitudId, String correoEvaluador, EvaluacionRequest request) {
        Solicitud solicitud = solicitudService.obtener(solicitudId);
        if (solicitud == null) {
            throw new IllegalArgumentException("La solicitud no existe.");
        }
        if (solicitud.getComiteId() == null) {
            throw new IllegalStateException("La solicitud aún no tiene un comité asignado.");
        }

        String estado = solicitud.getEstado();
        if (!"RECIBIDA".equals(estado) && !"EN_EVALUACION".equals(estado)) {
            throw new IllegalStateException("La solicitud ya fue resuelta: " + estado + ".");
        }

        Estudiante evaluador = estudianteRepository.findByCorreo(correoEvaluador)
                .orElseThrow(() -> new IllegalArgumentException("El evaluador no existe."));

        if (!comiteMiembroRepository.existsByComiteIdAndEstudianteId(solicitud.getComiteId(), evaluador.getId())) {
            throw new IllegalStateException("No pertenecés al comité asignado a esta solicitud.");
        }
        if (evaluacionRepository.existsBySolicitudIdAndEvaluadorId(solicitudId, evaluador.getId())) {
            throw new IllegalStateException("Ya evaluaste esta solicitud.");
        }

        if ("RECIBIDA".equals(estado)) {
            solicitudService.evaluar(solicitudId);
        }

        Evaluacion evaluacion = new Evaluacion();
        evaluacion.setSolicitudId(solicitudId);
        evaluacion.setEvaluadorId(evaluador.getId());
        evaluacion.setPuntaje(request.getPuntaje());
        evaluacion.setObservaciones(request.getObservaciones());
        Evaluacion guardada = evaluacionRepository.save(evaluacion);

        resolverSiEstaCompleta(solicitud);
        return guardada;
    }

    public List<Evaluacion> listarPorSolicitud(Long solicitudId) {
        return evaluacionRepository.findBySolicitudId(solicitudId);
    }

    private void resolverSiEstaCompleta(Solicitud solicitud) {
        List<Evaluacion> evaluaciones = evaluacionRepository.findBySolicitudId(solicitud.getId());
        int totalMiembros = comiteMiembroRepository.findByComiteId(solicitud.getComiteId()).size();
        if (evaluaciones.size() < totalMiembros) {
            return;
        }

        Convocatoria convocatoria = convocatoriaService.obtener(solicitud.getConvocatoriaId());
        if (convocatoria == null) {
            throw new IllegalStateException("La convocatoria de la solicitud no existe.");
        }
        CriterioEvaluacion criterio = criterios.get(convocatoria.getTipoBeca());
        if (criterio == null) {
            throw new IllegalStateException("No hay criterio de evaluación para el tipo de beca: " + convocatoria.getTipoBeca());
        }

        Solicitud resuelta = criterio.aprueba(evaluaciones)
                ? solicitudService.aprobar(solicitud.getId())
                : solicitudService.rechazar(solicitud.getId());

        eventPublisher.publishEvent(
                new SolicitudResueltaEvent(resuelta.getId(), resuelta.getEstudianteId(), resuelta.getEstado()));
    }
}