package com.becas.backend.repository;

import com.becas.backend.model.ComiteMiembro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComiteMiembroRepository extends JpaRepository<ComiteMiembro, Long> {
    List<ComiteMiembro> findByComiteId(Long comiteId);
    boolean existsByComiteIdAndEstudianteId(Long comiteId, Long estudianteId);
}