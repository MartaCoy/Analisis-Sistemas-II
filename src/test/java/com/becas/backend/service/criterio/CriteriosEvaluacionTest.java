package com.becas.backend.service.criterio;

import com.becas.backend.model.Evaluacion;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CriteriosEvaluacionTest {

    private List<Evaluacion> puntajes(int... valores) {
        List<Evaluacion> lista = new ArrayList<>();
        for (int v : valores) {
            Evaluacion e = new Evaluacion();
            e.setPuntaje(v);
            lista.add(e);
        }
        return lista;
    }

    @Test
    void academico_apruebaConPromedioDe70() {
        assertThat(new CriterioAcademico().aprueba(puntajes(70, 70))).isTrue();
    }

    @Test
    void academico_rechazaConPromedioBajo70() {
        assertThat(new CriterioAcademico().aprueba(puntajes(70, 69))).isFalse();
    }

    @Test
    void deportivo_apruebaConPromedioDe60() {
        assertThat(new CriterioDeportivo().aprueba(puntajes(60, 60))).isTrue();
    }

    @Test
    void deportivo_rechazaConPromedioBajo60() {
        assertThat(new CriterioDeportivo().aprueba(puntajes(60, 59))).isFalse();
    }

    @Test
    void socioeconomico_apruebaSiPromedioYSinVeto() {
        assertThat(new CriterioSocioeconomico().aprueba(puntajes(65, 65))).isTrue();
    }

    @Test
    void socioeconomico_rechazaSiUnEvaluadorVeta() {
        // promedio 78.3 alcanza, pero un evaluador dio 35 (< 40)
        assertThat(new CriterioSocioeconomico().aprueba(puntajes(100, 100, 35))).isFalse();
    }

    @Test
    void socioeconomico_rechazaConPromedioBajo() {
        assertThat(new CriterioSocioeconomico().aprueba(puntajes(60, 60))).isFalse();
    }

    @Test
    void cadaCriterioDeclaraSuTipoDeBeca() {
        assertThat(new CriterioAcademico().tipoBeca()).isEqualTo("ACADEMICA");
        assertThat(new CriterioDeportivo().tipoBeca()).isEqualTo("DEPORTIVA");
        assertThat(new CriterioSocioeconomico().tipoBeca()).isEqualTo("SOCIOECONOMICA");
    }
}