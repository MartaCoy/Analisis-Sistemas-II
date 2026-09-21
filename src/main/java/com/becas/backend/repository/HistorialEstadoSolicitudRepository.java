package com.becas.backend.repository;

import com.becas.backend.model.HistorialEstadoSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistorialEstadoSolicitudRepository extends JpaRepository<HistorialEstadoSolicitud, Long> {
    List<HistorialEstadoSolicitud> findBySolicitudIdOrderByFechaCambioAsc(Long solicitudId);
}