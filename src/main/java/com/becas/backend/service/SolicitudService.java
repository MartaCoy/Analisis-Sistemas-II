package com.becas.backend.service;

import com.becas.backend.dto.SolicitudRequest;
import com.becas.backend.model.*;
import com.becas.backend.repository.*;
import com.becas.backend.service.estado.EstadoSolicitud;
import com.becas.backend.service.estado.EstadoSolicitudFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

@Service
public class SolicitudService {
    private static final BigDecimal LIMITE_SEGUNDA_APROBACION = new BigDecimal("10000.00");

    private final SolicitudRepository solicitudes;
    private final ConvocatoriaRepository convocatorias;
    private final HistorialEstadoSolicitudRepository historial;
    private final AprobacionSolicitudRepository aprobaciones;
    private final RegistroSolicitudService registros;

    public SolicitudService(SolicitudRepository solicitudes,
                           ConvocatoriaRepository convocatorias,
                           HistorialEstadoSolicitudRepository historial,
                           AprobacionSolicitudRepository aprobaciones,
                           RegistroSolicitudService registros) {
        this.solicitudes = solicitudes;
        this.convocatorias = convocatorias;
        this.historial = historial;
        this.aprobaciones = aprobaciones;
        this.registros = registros;
    }

    private String actor() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || !autenticacion.isAuthenticated()
            || "anonymousUser".equals(autenticacion.getName())) {
            throw new IllegalStateException("Se requiere una sesión autenticada.");
        }
        return autenticacion.getName();
    }

    private Solicitud bloquear(Long id) {
        return solicitudes.bloquearPorId(id)
            .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));
    }

    private void validarMonto(BigDecimal monto) {
        if (monto == null || monto.signum() <= 0 || monto.scale() > 2 || monto.precision() > 14) {
            throw new IllegalStateException(
                "No se puede autorizar sin monto válido. Revisar la convocatoria o completar el monto de la solicitud.");
        }
    }

    public List<Solicitud> listarPorEstudiante(Long estudianteId) {
        return solicitudes.findByEstudianteId(estudianteId);
    }

    @Transactional
    public Solicitud crear(Long estudianteId, SolicitudRequest request) {
        Convocatoria convocatoria = convocatorias.findById(request.getConvocatoriaId())
            .orElseThrow(() -> new IllegalArgumentException("La convocatoria no existe."));
        if (!"PUBLICADA".equals(convocatoria.getEstado())) {
            throw new IllegalStateException("La convocatoria no está abierta para recibir solicitudes.");
        }
        validarMonto(convocatoria.getMontoBeca());
        if (solicitudes.findByEstudianteIdAndConvocatoriaId(estudianteId,
                request.getConvocatoriaId()).isPresent()) {
            throw new IllegalStateException("Ya existe una solicitud para esta convocatoria.");
        }
        Solicitud solicitud = new SolicitudBuilder()
            .estudiante(estudianteId)
            .convocatoria(request.getConvocatoriaId())
            .estadoInicial()
            .build();
        // Snapshot: cambiar el monto de la convocatoria no altera solicitudes anteriores.
        solicitud.setMontoSolicitado(convocatoria.getMontoBeca());
        Solicitud guardada = solicitudes.saveAndFlush(solicitud);
        registros.cambioEstado(guardada, null, actor());
        return guardada;
    }

    @Transactional(readOnly = true)
    public Solicitud obtener(Long id) { return solicitudes.findById(id).orElse(null); }

    @Transactional
    public Solicitud evaluar(Long id) {
        return cambiarEstado(id, EstadoSolicitud::evaluar, "INICIO_EVALUACION");
    }

    @Transactional
    public Solicitud aprobar(Long id) {
        Solicitud solicitud = bloquear(id);
        if (!"EN_EVALUACION".equals(solicitud.getEstado())) {
            throw new IllegalStateException("La solicitud no está en evaluación o ya requiere segunda aprobación.");
        }
        BigDecimal monto = solicitud.getMontoSolicitado();
        validarMonto(monto);
        if (aprobaciones.existsBySolicitudId(id)) {
            throw new IllegalStateException("La solicitud ya tiene una decisión de aprobación.");
        }
        String responsable = actor();
        String anterior = solicitud.getEstado();
        boolean necesitaSegunda = monto.compareTo(LIMITE_SEGUNDA_APROBACION) > 0;
        String nuevo = necesitaSegunda
            ? EstadoSolicitudFactory.obtener(anterior).solicitarSegundaAprobacion()
            : EstadoSolicitudFactory.obtener(anterior).aprobar();

        AprobacionSolicitud primera = new AprobacionSolicitud();
        primera.setSolicitudId(id);
        primera.setEtapa(1);
        primera.setActorCorreo(responsable);
        primera.setDecision("APROBADA");
        aprobaciones.save(primera);
        solicitud.setEstado(nuevo);
        Solicitud guardada = solicitudes.saveAndFlush(solicitud);
        registros.accion(id, responsable, "PRIMERA_APROBACION", "EXITOSA",
            "Monto verificado: " + monto + "; destino: " + nuevo);
        registros.cambioEstado(guardada, anterior, responsable);
        return guardada;
    }

    @Transactional
    public Solicitud resolverSegundaAprobacion(Long id, boolean aprobada, String observacion) {
        Solicitud solicitud = bloquear(id);
        if (!"PENDIENTE_SEGUNDA_APROBACION".equals(solicitud.getEstado())) {
            throw new IllegalStateException("La solicitud no está pendiente de segunda aprobación.");
        }
        validarMonto(solicitud.getMontoSolicitado());
        if (solicitud.getMontoSolicitado().compareTo(LIMITE_SEGUNDA_APROBACION) <= 0) {
            throw new IllegalStateException("Este monto no requiere segunda aprobación.");
        }
        AprobacionSolicitud primera = aprobaciones.findBySolicitudIdAndEtapa(id, 1)
            .orElseThrow(() -> new IllegalStateException("No se ha registrado la primera aprobación."));
        if (aprobaciones.findBySolicitudIdAndEtapa(id, 2).isPresent()) {
            throw new IllegalStateException("La segunda aprobación ya se registró.");
        }
        String responsable = actor();
        if (primera.getActorCorreo().equalsIgnoreCase(responsable)) {
            throw new IllegalStateException("La segunda decisión debe hacerla una persona diferente.");
        }
        if (observacion != null && observacion.length() > 500) {
            throw new IllegalArgumentException("La observación excede 500 caracteres.");
        }
        AprobacionSolicitud segunda = new AprobacionSolicitud();
        segunda.setSolicitudId(id);
        segunda.setEtapa(2);
        segunda.setActorCorreo(responsable);
        segunda.setDecision(aprobada ? "APROBADA" : "RECHAZADA");
        segunda.setObservacion(observacion);
        aprobaciones.save(segunda);
        String anterior = solicitud.getEstado();
        EstadoSolicitud estado = EstadoSolicitudFactory.obtener(anterior);
        solicitud.setEstado(aprobada ? estado.aprobar() : estado.rechazar());
        Solicitud guardada = solicitudes.saveAndFlush(solicitud);
        registros.accion(id, responsable, aprobada ? "SEGUNDA_APROBACION" : "SEGUNDA_APROBACION_RECHAZADA",
            "EXITOSA", "Decisión: " + segunda.getDecision() +
                (observacion == null ? "" : "; observación: " + observacion));
        registros.cambioEstado(guardada, anterior, responsable);
        return guardada;
    }

    @Transactional
    public Solicitud rechazar(Long id) {
        return cambiarEstado(id, EstadoSolicitud::rechazar, "RECHAZO_SOLICITUD");
    }

    @Transactional
    public Solicitud cambiarEstado(Long id, Function<EstadoSolicitud, String> transicion, String operacion) {
        Solicitud solicitud = bloquear(id);
        String responsable = actor();
        String anterior = solicitud.getEstado();
        String nuevo = transicion.apply(EstadoSolicitudFactory.obtener(anterior));
        solicitud.setEstado(nuevo);
        Solicitud guardada = solicitudes.saveAndFlush(solicitud);
        registros.accion(id, responsable, operacion, "EXITOSA", anterior + " -> " + nuevo);
        registros.cambioEstado(guardada, anterior, responsable);
        return guardada;
    }

    @Transactional
    public Solicitud asignarComite(Long id, Long comiteId) {
        Solicitud solicitud = bloquear(id);
        if (!List.of("RECIBIDA", "EN_EVALUACION").contains(solicitud.getEstado())) {
            throw new IllegalStateException("Una solicitud resuelta no admite reasignación de comité.");
        }
        if (!Objects.equals(solicitud.getComiteId(), comiteId)) {
            Long anterior = solicitud.getComiteId();
            solicitud.setComiteId(comiteId);
            solicitudes.saveAndFlush(solicitud);
            registros.accion(id, actor(), "ASIGNACION_COMITE", "EXITOSA",
                "Comité anterior: " + anterior + "; nuevo: " + comiteId);
        }
        return solicitud;
    }

    @Transactional
    public Solicitud actualizarMonto(Long id, BigDecimal monto) {
        Solicitud solicitud = bloquear(id);
        validarMonto(monto);
        if (!List.of("RECIBIDA", "EN_EVALUACION").contains(solicitud.getEstado())
            || aprobaciones.existsBySolicitudId(id)) {
            throw new IllegalStateException("No se puede modificar el monto después de iniciar las aprobaciones.");
        }
        BigDecimal anterior = solicitud.getMontoSolicitado();
        if (anterior == null || anterior.compareTo(monto) != 0) {
            solicitud.setMontoSolicitado(monto);
            solicitudes.saveAndFlush(solicitud);
            registros.accion(id, actor(), "MODIFICACION_MONTO", "EXITOSA",
                "Monto anterior: " + anterior + "; nuevo monto: " + monto);
        }
        return solicitud;
    }

    public List<HistorialEstadoSolicitud> obtenerHistorial(Long solicitudId) {
        return historial.findBySolicitudIdOrderByFechaCambioAsc(solicitudId);
    }

    @Transactional(readOnly = true)
    public List<AprobacionSolicitud> obtenerAprobaciones(Long solicitudId) {
        return aprobaciones.findBySolicitudIdOrderByEtapaAsc(solicitudId);
    }

    @Transactional(readOnly = true)
    public List<Solicitud> listarPendientesSegunda() {
        return solicitudes.findByEstadoOrderByFechaSolicitudDesc("PENDIENTE_SEGUNDA_APROBACION");
    }

    @Transactional(readOnly = true)
    public List<Solicitud> listarAsignadasParaEvaluador(Long evaluadorId) {
        return solicitudes.listarAsignadasParaEvaluador(evaluadorId);
    }
}
