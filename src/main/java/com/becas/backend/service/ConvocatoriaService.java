package com.becas.backend.service;

import com.becas.backend.dto.ConvocatoriaRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.repository.ConvocatoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ConvocatoriaService {

    @Autowired private ConvocatoriaRepository convocatoriaRepository;
    @Autowired private ConvocatoriaFactory convocatoriaFactory;

    public List<Convocatoria> listarActivas() {
        return convocatoriaRepository.findByEstado("PUBLICADA");
    }

    public List<Convocatoria> listarTodas() {
        return convocatoriaRepository.findAll();
    }

    public Convocatoria obtener(Long id) {
        return convocatoriaRepository.findById(id).orElse(null);
    }

    public Convocatoria crear(ConvocatoriaRequest request) {
        Convocatoria convocatoria = switch (request.getTipoBeca()) {
            case "DEPORTIVA" -> convocatoriaFactory.crearDeportiva(
                    request.getNombre(), request.getRequisitos(), request.getFechaApertura(), request.getFechaCierre());
            case "SOCIOECONOMICA" -> convocatoriaFactory.crearSocioeconomica(
                    request.getNombre(), request.getRequisitos(), request.getFechaApertura(), request.getFechaCierre());
            default -> convocatoriaFactory.crearAcademica(
                    request.getNombre(), request.getRequisitos(), request.getFechaApertura(), request.getFechaCierre());
        };
        return convocatoriaRepository.save(convocatoria);
    }

    public Convocatoria publicar(Long id) {
        Convocatoria c = obtener(id);
        if (c != null) { c.setEstado("PUBLICADA"); convocatoriaRepository.save(c); }
        return c;
    }

    public Convocatoria cerrar(Long id) {
        Convocatoria c = obtener(id);
        if (c != null) { c.setEstado("CERRADA"); convocatoriaRepository.save(c); }
        return c;
    }
    public Convocatoria editar(Long id, ConvocatoriaRequest request) {
        Convocatoria c = obtener(id);
        if (c == null) return null;
        c.setNombre(request.getNombre());
        c.setTipoBeca(request.getTipoBeca());
        c.setRequisitos(request.getRequisitos());
        c.setFechaApertura(request.getFechaApertura());
        c.setFechaCierre(request.getFechaCierre());
        return convocatoriaRepository.save(c);
    }
}