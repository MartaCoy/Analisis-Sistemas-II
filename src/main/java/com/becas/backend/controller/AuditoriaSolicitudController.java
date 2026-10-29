package com.becas.backend.controller;

import com.becas.backend.model.AuditoriaSolicitud;
import com.becas.backend.repository.AuditoriaSolicitudRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes/{solicitudId}/auditoria")
public class AuditoriaSolicitudController {
    private final AuditoriaSolicitudRepository repositorio;
    public AuditoriaSolicitudController(AuditoriaSolicitudRepository repositorio) {
        this.repositorio = repositorio;
    }

    @GetMapping
    public List<AuditoriaSolicitud> listar(@PathVariable Long solicitudId) {
        return repositorio.findBySolicitudIdOrderByFechaDesc(solicitudId);
    }
}
