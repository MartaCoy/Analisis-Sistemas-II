package com.becas.backend.service.criterio;

import com.becas.backend.model.Evaluacion;
import org.springframework.stereotype.Component;
import java.util.List;

/** Además del promedio, ningún evaluador puede haber dado un puntaje muy bajo (veto). */
@Component
public class CriterioSocioeconomico implements CriterioEvaluacion {

    private static final double PROMEDIO_MINIMO = 65;
    private static final int PUNTAJE_MINIMO_POR_EVALUADOR = 40;

    @Override
    public String tipoBeca() { return "SOCIOECONOMICA"; }

    @Override
    public boolean aprueba(List<Evaluacion> evaluaciones) {
        boolean sinVeto = evaluaciones.stream().allMatch(e -> e.getPuntaje() >= PUNTAJE_MINIMO_POR_EVALUADOR);
        return sinVeto && promedio(evaluaciones) >= PROMEDIO_MINIMO;
    }
}