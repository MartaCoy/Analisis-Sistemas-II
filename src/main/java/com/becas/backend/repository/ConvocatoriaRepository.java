package com.becas.backend.repository;

import com.becas.backend.model.Convocatoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ConvocatoriaRepository extends JpaRepository<Convocatoria, Long> {
    List<Convocatoria> findByEstado(String estado);

    // Evita carreras entre postulaciones simultaneas.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Convocatoria c where c.id = ?1")
    java.util.Optional<Convocatoria> bloquearParaPostulacion(
        Long convocatoriaId
    );
}