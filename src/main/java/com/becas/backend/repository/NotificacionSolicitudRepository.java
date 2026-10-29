package com.becas.backend.repository;

import com.becas.backend.model.NotificacionSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificacionSolicitudRepository extends JpaRepository<NotificacionSolicitud, Long> {
    List<NotificacionSolicitud> findByEstudianteIdOrderByFechaDesc(Long estudianteId);
    Optional<NotificacionSolicitud> findByIdAndEstudianteId(Long id, Long estudianteId);
}
