package com.becas.backend.service;

import com.becas.backend.dto.ComiteRequest;
import com.becas.backend.model.Comite;
import com.becas.backend.model.ComiteMiembro;
import com.becas.backend.repository.ComiteMiembroRepository;
import com.becas.backend.repository.ComiteRepository;
import com.becas.backend.repository.EstudianteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ComiteService {

    @Autowired private ComiteRepository comiteRepository;
    @Autowired private ComiteMiembroRepository comiteMiembroRepository;
    @Autowired private EstudianteRepository estudianteRepository;

    public List<Comite> listarTodos() {
        return comiteRepository.findAll();
    }

    public Comite crear(ComiteRequest request) {
        Comite comite = new Comite();
        comite.setNombre(request.getNombre());
        comite.setTipoBeca(request.getTipoBeca());
        return comiteRepository.save(comite);
    }

    public ComiteMiembro agregarMiembro(Long comiteId, Long estudianteId) {
        comiteRepository.findById(comiteId)
                .orElseThrow(() -> new IllegalArgumentException("El comité no existe."));
        estudianteRepository.findById(estudianteId)
                .orElseThrow(() -> new IllegalArgumentException("El estudiante no existe."));

        ComiteMiembro miembro = new ComiteMiembro();
        miembro.setComiteId(comiteId);
        miembro.setEstudianteId(estudianteId);
        return comiteMiembroRepository.save(miembro);
    }

    public List<ComiteMiembro> listarMiembros(Long comiteId) {
        return comiteMiembroRepository.findByComiteId(comiteId);
    }
}