package com.becas.backend.service;

import com.becas.backend.dto.ConvocatoriaRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.repository.ConvocatoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.math.BigDecimal;

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

    private void validarMonto(BigDecimal monto) {
        if (monto != null && (monto.signum() <= 0 || monto.scale() > 2 || monto.precision() > 14)) {
            throw new IllegalArgumentException("El monto de la beca debe ser positivo, con máximo dos decimales.");
        }
    }

    public Convocatoria crear(ConvocatoriaRequest request) {
        validarMonto(request.getMontoBeca());
        Convocatoria convocatoria = switch (request.getTipoBeca()) {
            case "DEPORTIVA" -> convocatoriaFactory.crearDeportiva(
                    request.getNombre(), request.getRequisitos(), request.getBeneficio(), request.getFechaApertura(), request.getFechaCierre());
            case "SOCIOECONOMICA" -> convocatoriaFactory.crearSocioeconomica(
                    request.getNombre(), request.getRequisitos(), request.getBeneficio(), request.getFechaApertura(), request.getFechaCierre());
            default -> convocatoriaFactory.crearAcademica(
                    request.getNombre(), request.getRequisitos(), request.getBeneficio(), request.getFechaApertura(), request.getFechaCierre());
        };
        convocatoria.setMontoBeca(request.getMontoBeca());
        return convocatoriaRepository.save(convocatoria);
    }

    public Convocatoria publicar(Long id) {
        Convocatoria c = obtener(id);
        if (c != null) {
            if (c.getMontoBeca() == null || c.getMontoBeca().signum() <= 0) {
                throw new IllegalStateException("Define el monto de la beca antes de publicar.");
            }
            c.setEstado("PUBLICADA");
            convocatoriaRepository.save(c);
        }
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
        validarMonto(request.getMontoBeca());
        if ("PUBLICADA".equals(c.getEstado()) && request.getMontoBeca() == null) {
            throw new IllegalArgumentException("Una convocatoria publicada no puede quedar sin monto.");
        }
        c.setMontoBeca(request.getMontoBeca());
        c.setNombre(request.getNombre());
        c.setTipoBeca(request.getTipoBeca());
        c.setRequisitos(request.getRequisitos());
        c.setBeneficio(request.getBeneficio());
        c.setFechaApertura(request.getFechaApertura());
        c.setFechaCierre(request.getFechaCierre());
        return convocatoriaRepository.save(c);
    }
}