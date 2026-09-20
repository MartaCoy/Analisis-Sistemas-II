package com.becas.backend.repository;

import com.becas.backend.model.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
    List<Evaluacion> findBySolicitudId(Long solicitudId);
    boolean existsBySolicitudIdAndEvaluadorId(Long solicitudId, Long evaluadorId);
}