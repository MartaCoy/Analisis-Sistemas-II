package com.becas.backend.repository;

import com.becas.backend.model.Comite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComiteRepository extends JpaRepository<Comite, Long> {
    List<Comite> findByTipoBeca(String tipoBeca);
}