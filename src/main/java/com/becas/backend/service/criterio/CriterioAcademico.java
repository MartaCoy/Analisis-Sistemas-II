package com.becas.backend.service.criterio;

import com.becas.backend.model.Evaluacion;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class CriterioAcademico implements CriterioEvaluacion {

    private static final double PROMEDIO_MINIMO = 70;

    @Override
    public String tipoBeca() { return "ACADEMICA"; }

    @Override
    public boolean aprueba(List<Evaluacion> evaluaciones) {
        return promedio(evaluaciones) >= PROMEDIO_MINIMO;
    }
}