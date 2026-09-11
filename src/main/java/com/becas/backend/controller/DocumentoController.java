package com.becas.backend.controller;

import com.becas.backend.model.Documento;
import com.becas.backend.model.Estudiante;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.service.DocumentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes/{solicitudId}/documentos")
public class DocumentoController {

    @Autowired
    private DocumentoService documentoService;

    @Autowired
    private EstudianteRepository estudianteRepository;

    @PostMapping
    public ResponseEntity<?> subir(@PathVariable Long solicitudId,
                                     @RequestParam("archivo") MultipartFile archivo,
                                     @RequestParam("tipoDocumento") String tipoDocumento,
                                     Authentication authentication) {
        try {
            Long estudianteId = obtenerEstudianteId(authentication);
            Documento documento = documentoService.subirDocumento(solicitudId, archivo, tipoDocumento, estudianteId);
            return ResponseEntity.ok(documento);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<Documento> listar(@PathVariable Long solicitudId) {
        return documentoService.listarPorSolicitud(solicitudId);
    }

    private Long obtenerEstudianteId(Authentication authentication) {
        String correo = authentication.getName();
        Estudiante estudiante = estudianteRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalStateException("Estudiante no encontrado."));
        return estudiante.getId();
    }
}