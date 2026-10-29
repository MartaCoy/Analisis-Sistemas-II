package com.becas.backend.repository;

import com.becas.backend.model.AuditoriaSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditoriaSolicitudRepository extends JpaRepository<AuditoriaSolicitud, Long> {
    List<AuditoriaSolicitud> findBySolicitudIdOrderByFechaDesc(Long solicitudId);
}
