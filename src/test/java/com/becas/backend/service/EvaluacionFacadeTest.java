package com.becas.backend.service;

import com.becas.backend.dto.EvaluacionRequest;
import com.becas.backend.model.ComiteMiembro;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.Estudiante;
import com.becas.backend.model.Evaluacion;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.ComiteMiembroRepository;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.repository.EvaluacionRepository;
import com.becas.backend.service.criterio.CriterioAcademico;
import com.becas.backend.service.criterio.CriterioDeportivo;
import com.becas.backend.service.criterio.CriterioSocioeconomico;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EvaluacionFacadeTest {

    private static final String CORREO = "evaluador@becas.gt";

    @Mock private SolicitudService solicitudService;
    @Mock private ConvocatoriaService convocatoriaService;
    @Mock private EvaluacionRepository evaluacionRepository;
    @Mock private ComiteMiembroRepository comiteMiembroRepository;
    @Mock private EstudianteRepository estudianteRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    private EvaluacionFacade facade;
    private Solicitud solicitud;

    @BeforeEach
    void setUp() {
        facade = new EvaluacionFacade(solicitudService, convocatoriaService, evaluacionRepository,
                comiteMiembroRepository, estudianteRepository, eventPublisher,
                List.of(new CriterioAcademico(), new CriterioDeportivo(), new CriterioSocioeconomico()));

        solicitud = new Solicitud();
        solicitud.setId(10L);
        solicitud.setEstudianteId(99L);
        solicitud.setConvocatoriaId(20L);
        solicitud.setComiteId(1L);
        solicitud.setEstado("RECIBIDA");
        when(solicitudService.obtener(10L)).thenReturn(solicitud);

        Estudiante evaluador = mock(Estudiante.class);
        when(evaluador.getId()).thenReturn(5L);
        when(estudianteRepository.findByCorreo(CORREO)).thenReturn(Optional.of(evaluador));
        when(comiteMiembroRepository.existsByComiteIdAndEstudianteId(1L, 5L)).thenReturn(true);
        when(evaluacionRepository.save(any(Evaluacion.class))).thenAnswer(inv -> inv.getArgument(0));

        Convocatoria convocatoria = new Convocatoria();
        convocatoria.setTipoBeca("ACADEMICA");
        when(convocatoriaService.obtener(20L)).thenReturn(convocatoria);
    }

    private EvaluacionRequest request(int puntaje) {
        EvaluacionRequest r = new EvaluacionRequest();
        r.setPuntaje(puntaje);
        return r;
    }

    private Evaluacion evaluacion(int puntaje) {
        Evaluacion e = new Evaluacion();
        e.setPuntaje(puntaje);
        return e;
    }

    private List<ComiteMiembro> miembros(int cantidad) {
        return Collections.nCopies(cantidad, new ComiteMiembro());
    }

    private Solicitud solicitudConEstado(String estado) {
        Solicitud s = new Solicitud();
        s.setId(10L);
        s.setEstudianteId(99L);
        s.setEstado(estado);
        return s;
    }

    @Test
    void solicitudSinComite_noSePuedeEvaluar() {
        solicitud.setComiteId(null);
        assertThrows(IllegalStateException.class, () -> facade.evaluar(10L, CORREO, request(80)));
    }

    @Test
    void solicitudYaResuelta_noSePuedeEvaluar() {
        solicitud.setEstado("APROBADA");
        assertThrows(IllegalStateException.class, () -> facade.evaluar(10L, CORREO, request(80)));
    }

    @Test
    void evaluadorFueraDelComite_noPuedeEvaluar() {
        when(comiteMiembroRepository.existsByComiteIdAndEstudianteId(1L, 5L)).thenReturn(false);
        assertThrows(IllegalStateException.class, () -> facade.evaluar(10L, CORREO, request(80)));
        verify(evaluacionRepository, never()).save(any());
    }

    @Test
    void evaluacionDuplicada_seRechaza() {
        when(evaluacionRepository.existsBySolicitudIdAndEvaluadorId(10L, 5L)).thenReturn(true);
        assertThrows(IllegalStateException.class, () -> facade.evaluar(10L, CORREO, request(80)));
        verify(evaluacionRepository, never()).save(any());
    }

    @Test
    void primeraEvaluacion_pasaAEnEvaluacion_ySeguraSinResolverSiFaltanMiembros() {
        when(comiteMiembroRepository.findByComiteId(1L)).thenReturn(miembros(2));
        when(evaluacionRepository.findBySolicitudId(10L)).thenReturn(List.of(evaluacion(80)));

        Evaluacion resultado = facade.evaluar(10L, CORREO, request(80));

        assertThat(resultado.getPuntaje()).isEqualTo(80);
        verify(solicitudService).evaluar(10L);
        verify(solicitudService, never()).aprobar(any());
        verify(solicitudService, never()).rechazar(any());
    }

    @Test
    void ultimaEvaluacion_conPromedioSuficiente_apruebaYPublicaEvento() {
        solicitud.setEstado("EN_EVALUACION");
        when(comiteMiembroRepository.findByComiteId(1L)).thenReturn(miembros(2));
        when(evaluacionRepository.findBySolicitudId(10L)).thenReturn(List.of(evaluacion(80), evaluacion(75)));
        when(solicitudService.aprobar(10L)).thenReturn(solicitudConEstado("APROBADA"));

        facade.evaluar(10L, CORREO, request(75));

        verify(solicitudService, never()).evaluar(any());
        verify(solicitudService).aprobar(10L);
        verify(eventPublisher).publishEvent(any(SolicitudResueltaEvent.class));
    }

    @Test
    void ultimaEvaluacion_conPromedioInsuficiente_rechazaYPublicaEvento() {
        solicitud.setEstado("EN_EVALUACION");
        when(comiteMiembroRepository.findByComiteId(1L)).thenReturn(miembros(2));
        when(evaluacionRepository.findBySolicitudId(10L)).thenReturn(List.of(evaluacion(50), evaluacion(60)));
        when(solicitudService.rechazar(10L)).thenReturn(solicitudConEstado("RECHAZADA"));

        facade.evaluar(10L, CORREO, request(60));

        verify(solicitudService).rechazar(10L);
        verify(solicitudService, never()).aprobar(any());
        verify(eventPublisher).publishEvent(any(SolicitudResueltaEvent.class));
    }
}