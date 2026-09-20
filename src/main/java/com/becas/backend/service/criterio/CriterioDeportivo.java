package com.becas.backend.service.criterio;

import com.becas.backend.model.Evaluacion;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class CriterioDeportivo implements CriterioEvaluacion {

    private static final double PROMEDIO_MINIMO = 60;

    @Override
    public String tipoBeca() { return "DEPORTIVA"; }

    @Override
    public boolean aprueba(List<Evaluacion> evaluaciones) {
        return promedio(evaluaciones) >= PROMEDIO_MINIMO;
    }
}