package com.becas.backend.repository;

import com.becas.backend.model.AprobacionSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AprobacionSolicitudRepository extends JpaRepository<AprobacionSolicitud, Long> {
    List<AprobacionSolicitud> findBySolicitudIdOrderByEtapaAsc(Long solicitudId);
    Optional<AprobacionSolicitud> findBySolicitudIdAndEtapa(Long solicitudId, int etapa);
    boolean existsBySolicitudId(Long solicitudId);
}
