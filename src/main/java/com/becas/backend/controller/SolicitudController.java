package com.becas.backend.controller;

import com.becas.backend.dto.*;
import com.becas.backend.model.*;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.service.SolicitudService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {
    private final SolicitudService solicitudes;
    private final EstudianteRepository estudiantes;

    public SolicitudController(SolicitudService solicitudes, EstudianteRepository estudiantes) {
        this.solicitudes = solicitudes;
        this.estudiantes = estudiantes;
    }

    private boolean administrador(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMINISTRADOR".equals(a.getAuthority()));
    }

    private Long estudianteId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return estudiantes.findByCorreo(auth.getName())
            .map(Estudiante::getId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private Solicitud lecturaAutorizada(Long id, Authentication auth) {
        Solicitud s = solicitudes.obtener(id);
        if (s == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (!administrador(auth) && !s.getEstudianteId().equals(estudianteId(auth))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return s;
    }

    @GetMapping("/mias")
    public List<Solicitud> mias(Authentication auth) {
        return solicitudes.listarPorEstudiante(estudianteId(auth));
    }

    @GetMapping("/pendientes-segunda")
    public List<Solicitud> pendientesSegunda() {
        return solicitudes.listarPendientesSegunda();
    }

    @GetMapping("/{id}")
    public Solicitud obtener(@PathVariable Long id, Authentication auth) {
        return lecturaAutorizada(id, auth);
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody SolicitudRequest request, Authentication auth) {
        try {
            return ResponseEntity.ok(solicitudes.crear(estudianteId(auth), request));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/evaluar")
    public ResponseEntity<?> evaluar(@PathVariable Long id) {
        try { return ResponseEntity.ok(solicitudes.evaluar(id)); }
        catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<?> aprobar(@PathVariable Long id) {
        try { return ResponseEntity.ok(solicitudes.aprobar(id)); }
        catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/segunda-aprobacion")
    public ResponseEntity<?> segunda(@PathVariable Long id,
        @Valid @RequestBody SegundaAprobacionRequest request) {
        try {
            return ResponseEntity.ok(solicitudes.resolverSegundaAprobacion(
                id, request.aprobada(), request.observacion()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Long id) {
        try { return ResponseEntity.ok(solicitudes.rechazar(id)); }
        catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/asignar/{comiteId}")
    public ResponseEntity<?> asignarComite(@PathVariable Long id, @PathVariable Long comiteId) {
        try { return ResponseEntity.ok(solicitudes.asignarComite(id, comiteId)); }
        catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/monto")
    public ResponseEntity<?> monto(@PathVariable Long id,
        @Valid @RequestBody MontoSolicitudRequest request) {
        try { return ResponseEntity.ok(solicitudes.actualizarMonto(id, request.monto())); }
        catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/aprobaciones")
    public List<AprobacionSolicitud> aprobaciones(@PathVariable Long id) {
        return solicitudes.obtenerAprobaciones(id);
    }

    @GetMapping("/{id}/historial")
    public List<HistorialEstadoSolicitud> historial(@PathVariable Long id, Authentication auth) {
        lecturaAutorizada(id, auth);
        return solicitudes.obtenerHistorial(id);
    }
}
