package com.becas.backend.controller;

import com.becas.backend.model.Estudiante;
import com.becas.backend.model.NotificacionSolicitud;
import com.becas.backend.repository.EstudianteRepository;
import com.becas.backend.repository.NotificacionSolicitudRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {
    private final EstudianteRepository estudiantes;
    private final NotificacionSolicitudRepository notificaciones;

    public NotificacionController(EstudianteRepository estudiantes,
        NotificacionSolicitudRepository notificaciones) {
        this.estudiantes = estudiantes;
        this.notificaciones = notificaciones;
    }

    private Long estudianteId(Authentication auth) {
        return estudiantes.findByCorreo(auth.getName())
            .map(Estudiante::getId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    @GetMapping("/mias")
    public List<NotificacionSolicitud> mias(Authentication auth) {
        return notificaciones.findByEstudianteIdOrderByFechaDesc(estudianteId(auth));
    }

    @PutMapping("/{id}/leer")
    @Transactional
    public NotificacionSolicitud marcarLeida(@PathVariable Long id, Authentication auth) {
        NotificacionSolicitud notificacion = notificaciones.findByIdAndEstudianteId(
                id, estudianteId(auth))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        notificacion.setLeida(true);
        return notificaciones.save(notificacion);
    }
}
