package com.becas.backend.repository;

import com.becas.backend.model.Convocatoria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConvocatoriaRepository extends JpaRepository<Convocatoria, Long> {
    List<Convocatoria> findByEstado(String estado);
}