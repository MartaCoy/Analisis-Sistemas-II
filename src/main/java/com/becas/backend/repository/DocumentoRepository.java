package com.becas.backend.repository;

import com.becas.backend.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findBySolicitudId(Long solicitudId);
}