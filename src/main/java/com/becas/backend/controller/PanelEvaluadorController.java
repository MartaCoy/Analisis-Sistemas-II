package com.becas.backend.controller;

import com.becas.backend.dto.PanelEvaluadorResponse;
import com.becas.backend.model.Estudiante;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.service.SolicitudService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/panel-evaluador")
public class PanelEvaluadorController {

    private final SolicitudService solicitudService;
    private final EstudianteRepository estudianteRepository;

    public PanelEvaluadorController(
        SolicitudService solicitudService,
        EstudianteRepository estudianteRepository
    ) {
        this.solicitudService = solicitudService;
        this.estudianteRepository = estudianteRepository;
    }

    @GetMapping("/solicitudes")
    public PanelEvaluadorResponse listar(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        Long evaluadorId = estudianteRepository
            .findByCorreo(authentication.getName())
            .map(Estudiante::getId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.FORBIDDEN)
            );

        return new PanelEvaluadorResponse(
            evaluadorId,
            solicitudService.listarAsignadasParaEvaluador(evaluadorId)
        );
    }
}
