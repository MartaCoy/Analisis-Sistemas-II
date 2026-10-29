package com.becas.backend.controller;
import java.util.Locale;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.core.io.Resource;

import com.becas.backend.model.Documento;
import com.becas.backend.model.Estudiante;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.service.DocumentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.becas.backend.model.Solicitud;
import com.becas.backend.service.SolicitudService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes/{solicitudId}/documentos")
public class DocumentoController {

    @Autowired
    private DocumentoService documentoService;

    @Autowired
    private EstudianteRepository estudianteRepository;

    @Autowired
    private SolicitudService solicitudService;

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
    public List<Documento> listar(@PathVariable Long solicitudId, Authentication authentication) {
        Solicitud solicitud = solicitudService.obtener(solicitudId);
        if (solicitud == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        boolean admin = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMINISTRADOR".equals(a.getAuthority()));
        if (!admin && !solicitud.getEstudianteId().equals(obtenerEstudianteId(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return documentoService.listarPorSolicitud(solicitudId);
    }


    // VISOR_DOCUMENTOS_PROTEGIDOS_V1
    @GetMapping("/{documentoId}/archivo")
    public ResponseEntity<Resource> descargarArchivo(
            @PathVariable Long solicitudId, @PathVariable Long documentoId,
            @RequestParam(name="descargar", defaultValue="false") boolean descargar,
            Authentication authentication) {
        listar(solicitudId, authentication);
        Documento doc = documentoService.buscarDocumento(solicitudId, documentoId);
        Resource recurso = documentoService.leerDocumento(doc);
        String nombre = doc.getNombreArchivo() == null ? "documento"
            : doc.getNombreArchivo().replace('/', '_').replace('\\', '_')
                .replace('\r', '_').replace('\n', '_');
        String n = nombre.toLowerCase(Locale.ROOT);
        MediaType tipo = n.endsWith(".pdf") ? MediaType.APPLICATION_PDF
            : (n.endsWith(".jpg") || n.endsWith(".jpeg")) ? MediaType.IMAGE_JPEG
            : n.endsWith(".png") ? MediaType.IMAGE_PNG
            : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition d = (descargar ? ContentDisposition.attachment()
            : ContentDisposition.inline()).filename(nombre, StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, d.toString())
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0")
            .header("X-Content-Type-Options", "nosniff")
            .contentType(tipo).body(recurso);
    }

    private Long obtenerEstudianteId(Authentication authentication) {
        String correo = authentication.getName();
        Estudiante estudiante = estudianteRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalStateException("Estudiante no encontrado."));
        return estudiante.getId();
    }
}