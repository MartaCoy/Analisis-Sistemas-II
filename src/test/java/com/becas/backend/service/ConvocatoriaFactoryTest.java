package com.becas.backend.service;

import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.ConvocatoriaBuilder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 2 - Patrones Factory Method y Builder aplicados a convocatorias.
 *
 * Aqui NO se usan mocks: ni la factory ni el builder tienen dependencias
 * externas, asi que se prueban las clases reales.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@DisplayName("ConvocatoriaFactory y ConvocatoriaBuilder")
class ConvocatoriaFactoryTest {

    private ConvocatoriaFactory factory;

    private static final LocalDate APERTURA = LocalDate.of(2026, 9, 15);
    private static final LocalDate CIERRE = LocalDate.of(2026, 10, 30);

    @BeforeEach
    void inicializar() {
        factory = new ConvocatoriaFactory();
    }

    // ------------------------------------------------------------------
    // Factory Method: el tipo de beca lo fija la factory, no el llamador
    // ------------------------------------------------------------------

    @Test
    @DisplayName("crearAcademica fija el tipo de beca en ACADEMICA")
    void academicaFijaSuTipo() {
        Convocatoria c = factory.crearAcademica(
                "Beca de Excelencia", "Promedio minimo de 85", "100% de colegiatura", APERTURA, CIERRE);

        assertThat(c.getTipoBeca()).isEqualTo("ACADEMICA");
    }

    @Test
    @DisplayName("crearDeportiva fija el tipo de beca en DEPORTIVA")
    void deportivaFijaSuTipo() {
        Convocatoria c = factory.crearDeportiva(
                "Beca Deportiva", "Pertenecer a seleccion", "50% de colegiatura", APERTURA, CIERRE);

        assertThat(c.getTipoBeca()).isEqualTo("DEPORTIVA");
    }

    @Test
    @DisplayName("crearSocioeconomica fija el tipo de beca en SOCIOECONOMICA")
    void socioeconomicaFijaSuTipo() {
        Convocatoria c = factory.crearSocioeconomica(
                "Beca Socioeconomica", "Estudio socioeconomico aprobado", "75% de colegiatura", APERTURA, CIERRE);

        assertThat(c.getTipoBeca()).isEqualTo("SOCIOECONOMICA");
    }

    @Test
    @DisplayName("Los tres tipos producen convocatorias con tipos distintos entre si")
    void losTresTiposSonDistintos() {
        String academica = factory.crearAcademica("A", "r", "b", APERTURA, CIERRE).getTipoBeca();
        String deportiva = factory.crearDeportiva("D", "r", "b", APERTURA, CIERRE).getTipoBeca();
        String socio = factory.crearSocioeconomica("S", "r", "b", APERTURA, CIERRE).getTipoBeca();

        assertThat(academica).isNotEqualTo(deportiva).isNotEqualTo(socio);
        assertThat(deportiva).isNotEqualTo(socio);
    }

    // ------------------------------------------------------------------
    // Mapeo de datos
    // ------------------------------------------------------------------

    @Test
    @DisplayName("La factory traslada nombre, requisitos, beneficio y fechas sin alterarlos")
    void trasladaTodosLosDatos() {
        Convocatoria c = factory.crearAcademica(
                "Beca de Excelencia Academica 2026",
                "Promedio minimo de 85 puntos",
                "Cobertura del 100% de la colegiatura",
                APERTURA, CIERRE);

        assertThat(c.getNombre()).isEqualTo("Beca de Excelencia Academica 2026");
        assertThat(c.getRequisitos()).isEqualTo("Promedio minimo de 85 puntos");
        assertThat(c.getBeneficio()).isEqualTo("Cobertura del 100% de la colegiatura");
        assertThat(c.getFechaApertura()).isEqualTo(APERTURA);
        assertThat(c.getFechaCierre()).isEqualTo(CIERRE);
    }

    @Test
    @DisplayName("Una convocatoria recien creada nace en estado BORRADOR y sin id")
    void naceEnBorradorYSinId() {
        Convocatoria c = factory.crearDeportiva("Beca Deportiva", "r", "b", APERTURA, CIERRE);

        assertThat(c.getEstado()).isEqualTo("BORRADOR");
        assertThat(c.getId()).isNull();
    }

    @Test
    @DisplayName("Cada llamada a la factory devuelve una instancia independiente")
    void cadaLlamadaDevuelveInstanciaNueva() {
        Convocatoria primera = factory.crearAcademica("Primera", "r", "b", APERTURA, CIERRE);
        Convocatoria segunda = factory.crearAcademica("Segunda", "r", "b", APERTURA, CIERRE);

        assertThat(primera).isNotSameAs(segunda);
        assertThat(primera.getNombre()).isEqualTo("Primera");
        assertThat(segunda.getNombre()).isEqualTo("Segunda");
    }

    // ------------------------------------------------------------------
    // Builder
    // ------------------------------------------------------------------

    @Test
    @DisplayName("El builder permite encadenar y construye la convocatoria completa")
    void builderEncadenaYConstruye() {
        Convocatoria c = new ConvocatoriaBuilder()
                .nombre("Beca Mixta")
                .tipoBeca("ACADEMICA")
                .requisitos("Requisitos de prueba")
                .beneficio("Beneficio de prueba")
                .fechaApertura(APERTURA)
                .fechaCierre(CIERRE)
                .build();

        assertThat(c.getNombre()).isEqualTo("Beca Mixta");
        assertThat(c.getTipoBeca()).isEqualTo("ACADEMICA");
        assertThat(c.getRequisitos()).isEqualTo("Requisitos de prueba");
        assertThat(c.getBeneficio()).isEqualTo("Beneficio de prueba");
        assertThat(c.getFechaApertura()).isEqualTo(APERTURA);
        assertThat(c.getFechaCierre()).isEqualTo(CIERRE);
    }

    @Test
    @DisplayName("El builder deja en null los campos que no se especifican")
    void builderDejaCamposOpcionalesEnNull() {
        Convocatoria c = new ConvocatoriaBuilder()
                .nombre("Solo nombre")
                .tipoBeca("ACADEMICA")
                .build();

        assertThat(c.getNombre()).isEqualTo("Solo nombre");
        assertThat(c.getRequisitos()).isNull();
        assertThat(c.getBeneficio()).isNull();
        assertThat(c.getFechaApertura()).isNull();
        assertThat(c.getFechaCierre()).isNull();
        assertThat(c.getEstado()).isEqualTo("BORRADOR");
    }
}
