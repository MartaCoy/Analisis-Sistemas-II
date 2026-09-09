package com.becas.backend.controller;

import com.becas.backend.dto.SolicitudRequest;
import com.becas.backend.model.Estudiante;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.service.SolicitudService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    @Autowired
    private SolicitudService solicitudService;

    @Autowired
    private EstudianteRepository estudianteRepository;

    @GetMapping("/mias")
    public List<Solicitud> listarMisSolicitudes(Authentication authentication) {
        Long estudianteId = obtenerEstudianteId(authentication);
        return solicitudService.listarPorEstudiante(estudianteId);
    }

    @GetMapping("/{id}")
    public Solicitud obtener(@PathVariable Long id) {
        return solicitudService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody SolicitudRequest request, Authentication authentication) {
        try {
            Long estudianteId = obtenerEstudianteId(authentication);
            Solicitud solicitud = solicitudService.crear(estudianteId, request);
            return ResponseEntity.ok(solicitud);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private Long obtenerEstudianteId(Authentication authentication) {
        String correo = authentication.getName();
        Estudiante estudiante = estudianteRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalStateException("Estudiante no encontrado."));
        return estudiante.getId();
    }
}