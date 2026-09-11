package com.becas.backend.repository;
import com.becas.backend.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
    List<Solicitud> findByEstudianteId(Long estudianteId);
    Optional<Solicitud> findByEstudianteIdAndConvocatoriaId(Long estudianteId, Long convocatoriaId);
}