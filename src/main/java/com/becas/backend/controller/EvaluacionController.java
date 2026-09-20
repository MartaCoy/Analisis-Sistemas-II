package com.becas.backend.controller;

import com.becas.backend.dto.EvaluacionRequest;
import com.becas.backend.model.Evaluacion;
import com.becas.backend.service.EvaluacionFacade;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes/{solicitudId}/evaluaciones")
public class EvaluacionController {

    @Autowired
    private EvaluacionFacade evaluacionFacade;

    @PostMapping
    public ResponseEntity<?> evaluar(@PathVariable Long solicitudId,
                                     @Valid @RequestBody EvaluacionRequest request,
                                     Authentication authentication) {
        try {
            return ResponseEntity.ok(evaluacionFacade.evaluar(solicitudId, authentication.getName(), request));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<Evaluacion> listar(@PathVariable Long solicitudId) {
        return evaluacionFacade.listarPorSolicitud(solicitudId);
    }
}