package com.becas.backend.service.criterio;

import com.becas.backend.model.Evaluacion;
import java.util.List;

/** Strategy: cada tipo de beca decide con su propia regla si una solicitud se aprueba. */
public interface CriterioEvaluacion {

    String tipoBeca();

    boolean aprueba(List<Evaluacion> evaluaciones);

    default double promedio(List<Evaluacion> evaluaciones) {
        return evaluaciones.stream().mapToInt(Evaluacion::getPuntaje).average().orElse(0);
    }
}