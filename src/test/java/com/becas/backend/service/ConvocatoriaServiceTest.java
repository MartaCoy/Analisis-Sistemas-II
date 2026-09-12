package com.becas.backend.service;

import com.becas.backend.dto.ConvocatoriaRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.repository.ConvocatoriaRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 2 - HU-04 / HU-05: modulo de convocatorias.
 *
 * Pruebas unitarias del CRUD y el listado. El repositorio y la factory se
 * sustituyen por dobles de prueba (Mockito), por lo que estas pruebas no
 * levantan el contexto de Spring ni requieren PostgreSQL.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConvocatoriaService - CRUD y listado")
class ConvocatoriaServiceTest {

    @Mock
    private ConvocatoriaRepository convocatoriaRepository;

    @Mock
    private ConvocatoriaFactory convocatoriaFactory;

    @InjectMocks
    private ConvocatoriaService convocatoriaService;

    private static final LocalDate APERTURA = LocalDate.of(2026, 9, 15);
    private static final LocalDate CIERRE = LocalDate.of(2026, 10, 30);

    private ConvocatoriaRequest request;
    private Convocatoria convocatoriaGuardada;

    @BeforeEach
    void prepararDatos() {
        request = new ConvocatoriaRequest();
        request.setNombre("Beca de Excelencia Academica 2026");
        request.setTipoBeca("ACADEMICA");
        request.setRequisitos("Promedio minimo de 85 puntos");
        request.setBeneficio("Cobertura del 100% de la colegiatura");
        request.setFechaApertura(APERTURA);
        request.setFechaCierre(CIERRE);

        convocatoriaGuardada = new Convocatoria();
        convocatoriaGuardada.setId(1L);
        convocatoriaGuardada.setNombre("Beca de Excelencia Academica 2026");
        convocatoriaGuardada.setTipoBeca("ACADEMICA");
        convocatoriaGuardada.setRequisitos("Promedio minimo de 85 puntos");
        convocatoriaGuardada.setBeneficio("Cobertura del 100% de la colegiatura");
        convocatoriaGuardada.setFechaApertura(APERTURA);
        convocatoriaGuardada.setFechaCierre(CIERRE);
    }

    private Convocatoria nueva(Long id, String nombre, String estado) {
        Convocatoria c = new Convocatoria();
        c.setId(id);
        c.setNombre(nombre);
        c.setTipoBeca("ACADEMICA");
        c.setEstado(estado);
        return c;
    }

    // ==================================================================
    // LISTADO (HU-05)
    // ==================================================================

    @Nested
    @DisplayName("Listado de convocatorias")
    class Listado {

        @Test
        @DisplayName("listarActivas consulta unicamente las que estan PUBLICADA")
        void listarActivasFiltraPorEstadoPublicada() {
            List<Convocatoria> publicadas = List.of(
                    nueva(1L, "Beca Academica", "PUBLICADA"),
                    nueva(2L, "Beca Deportiva", "PUBLICADA"));
            when(convocatoriaRepository.findByEstado("PUBLICADA")).thenReturn(publicadas);

            List<Convocatoria> resultado = convocatoriaService.listarActivas();

            assertThat(resultado).hasSize(2);
            assertThat(resultado).allMatch(c -> "PUBLICADA".equals(c.getEstado()));
            verify(convocatoriaRepository).findByEstado("PUBLICADA");
            verify(convocatoriaRepository, never()).findAll();
        }

        @Test
        @DisplayName("listarActivas devuelve lista vacia si no hay convocatorias publicadas")
        void listarActivasSinResultados() {
            when(convocatoriaRepository.findByEstado("PUBLICADA")).thenReturn(List.of());

            assertThat(convocatoriaService.listarActivas()).isEmpty();
        }

        @Test
        @DisplayName("listarTodas no filtra por estado (incluye borradores y cerradas)")
        void listarTodasIncluyeTodosLosEstados() {
            List<Convocatoria> todas = List.of(
                    nueva(1L, "Publicada", "PUBLICADA"),
                    nueva(2L, "Borrador", "BORRADOR"),
                    nueva(3L, "Cerrada", "CERRADA"));
            when(convocatoriaRepository.findAll()).thenReturn(todas);

            List<Convocatoria> resultado = convocatoriaService.listarTodas();

            assertThat(resultado).hasSize(3);
            assertThat(resultado).extracting(Convocatoria::getEstado)
                    .containsExactly("PUBLICADA", "BORRADOR", "CERRADA");
            verify(convocatoriaRepository, never()).findByEstado(anyString());
        }
    }

    // ==================================================================
    // CONSULTA POR ID
    // ==================================================================

    @Nested
    @DisplayName("Consulta por id")
    class Consulta {

        @Test
        @DisplayName("obtener devuelve la convocatoria cuando el id existe")
        void obtieneConvocatoriaExistente() {
            when(convocatoriaRepository.findById(1L))
                    .thenReturn(Optional.of(convocatoriaGuardada));

            Convocatoria resultado = convocatoriaService.obtener(1L);

            assertThat(resultado).isNotNull();
            assertThat(resultado.getId()).isEqualTo(1L);
            assertThat(resultado.getNombre()).isEqualTo("Beca de Excelencia Academica 2026");
        }

        @Test
        @DisplayName("obtener devuelve null cuando el id no existe")
        void obtieneNullSiNoExiste() {
            when(convocatoriaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThat(convocatoriaService.obtener(999L)).isNull();
        }
    }

    // ==================================================================
    // CREACION (HU-04) - delega en la factory segun el tipo de beca
    // ==================================================================

    @Nested
    @DisplayName("Creacion de convocatorias")
    class Creacion {

        @Test
        @DisplayName("Crea una beca ACADEMICA usando la factory correspondiente")
        void creaBecaAcademica() {
            when(convocatoriaFactory.crearAcademica(
                    request.getNombre(), request.getRequisitos(), request.getBeneficio(), APERTURA, CIERRE))
                    .thenReturn(convocatoriaGuardada);
            when(convocatoriaRepository.save(convocatoriaGuardada)).thenReturn(convocatoriaGuardada);

            Convocatoria resultado = convocatoriaService.crear(request);

            assertThat(resultado).isSameAs(convocatoriaGuardada);
            verify(convocatoriaFactory).crearAcademica(
                    anyString(), anyString(), anyString(), eq(APERTURA), eq(CIERRE));
            verify(convocatoriaFactory, never()).crearDeportiva(any(), any(), any(), any(), any());
            verify(convocatoriaFactory, never()).crearSocioeconomica(any(), any(), any(), any(), any());
            verify(convocatoriaRepository).save(convocatoriaGuardada);
        }

        @Test
        @DisplayName("Crea una beca DEPORTIVA usando la factory correspondiente")
        void creaBecaDeportiva() {
            request.setTipoBeca("DEPORTIVA");
            Convocatoria deportiva = nueva(2L, "Beca Deportiva 2026", "BORRADOR");
            deportiva.setTipoBeca("DEPORTIVA");

            when(convocatoriaFactory.crearDeportiva(any(), any(), any(), any(), any()))
                    .thenReturn(deportiva);
            when(convocatoriaRepository.save(deportiva)).thenReturn(deportiva);

            Convocatoria resultado = convocatoriaService.crear(request);

            assertThat(resultado.getTipoBeca()).isEqualTo("DEPORTIVA");
            verify(convocatoriaFactory).crearDeportiva(any(), any(), any(), any(), any());
            verify(convocatoriaFactory, never()).crearAcademica(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Crea una beca SOCIOECONOMICA usando la factory correspondiente")
        void creaBecaSocioeconomica() {
            request.setTipoBeca("SOCIOECONOMICA");
            Convocatoria socio = nueva(3L, "Beca Socioeconomica 2026", "BORRADOR");
            socio.setTipoBeca("SOCIOECONOMICA");

            when(convocatoriaFactory.crearSocioeconomica(any(), any(), any(), any(), any()))
                    .thenReturn(socio);
            when(convocatoriaRepository.save(socio)).thenReturn(socio);

            Convocatoria resultado = convocatoriaService.crear(request);

            assertThat(resultado.getTipoBeca()).isEqualTo("SOCIOECONOMICA");
            verify(convocatoriaFactory).crearSocioeconomica(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Un tipo de beca desconocido cae en ACADEMICA por defecto")
        void tipoDesconocidoUsaAcademicaPorDefecto() {
            request.setTipoBeca("TIPO_QUE_NO_EXISTE");

            when(convocatoriaFactory.crearAcademica(any(), any(), any(), any(), any()))
                    .thenReturn(convocatoriaGuardada);
            when(convocatoriaRepository.save(any(Convocatoria.class)))
                    .thenReturn(convocatoriaGuardada);

            Convocatoria resultado = convocatoriaService.crear(request);

            assertThat(resultado).isNotNull();
            verify(convocatoriaFactory).crearAcademica(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Toda convocatoria nueva se persiste en estado BORRADOR")
        void convocatoriaNuevaNaceEnBorrador() {
            Convocatoria recienCreada = new ConvocatoriaCaptor().construir();

            when(convocatoriaFactory.crearAcademica(any(), any(), any(), any(), any()))
                    .thenReturn(recienCreada);
            when(convocatoriaRepository.save(any(Convocatoria.class))).thenReturn(recienCreada);

            convocatoriaService.crear(request);

            ArgumentCaptor<Convocatoria> captor = ArgumentCaptor.forClass(Convocatoria.class);
            verify(convocatoriaRepository).save(captor.capture());
            assertThat(captor.getValue().getEstado()).isEqualTo("BORRADOR");
        }
    }

    /** Ayuda para construir una convocatoria sin estado explicito. */
    private static class ConvocatoriaCaptor {
        Convocatoria construir() {
            Convocatoria c = new Convocatoria();
            c.setNombre("Beca de Excelencia Academica 2026");
            c.setTipoBeca("ACADEMICA");
            return c;
        }
    }

    // ==================================================================
    // CAMBIOS DE ESTADO
    // ==================================================================

    @Nested
    @DisplayName("Publicar y cerrar")
    class CambiosDeEstado {

        @Test
        @DisplayName("publicar cambia el estado a PUBLICADA y persiste")
        void publicaConvocatoria() {
            Convocatoria borrador = nueva(1L, "Beca Academica", "BORRADOR");
            when(convocatoriaRepository.findById(1L)).thenReturn(Optional.of(borrador));

            Convocatoria resultado = convocatoriaService.publicar(1L);

            assertThat(resultado.getEstado()).isEqualTo("PUBLICADA");
            verify(convocatoriaRepository).save(borrador);
        }

        @Test
        @DisplayName("cerrar cambia el estado a CERRADA y persiste")
        void cierraConvocatoria() {
            Convocatoria publicada = nueva(1L, "Beca Academica", "PUBLICADA");
            when(convocatoriaRepository.findById(1L)).thenReturn(Optional.of(publicada));

            Convocatoria resultado = convocatoriaService.cerrar(1L);

            assertThat(resultado.getEstado()).isEqualTo("CERRADA");
            verify(convocatoriaRepository).save(publicada);
        }

        @Test
        @DisplayName("publicar un id inexistente devuelve null y no guarda nada")
        void publicarIdInexistenteNoGuarda() {
            when(convocatoriaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThat(convocatoriaService.publicar(999L)).isNull();
            verify(convocatoriaRepository, never()).save(any(Convocatoria.class));
        }

        @Test
        @DisplayName("cerrar un id inexistente devuelve null y no guarda nada")
        void cerrarIdInexistenteNoGuarda() {
            when(convocatoriaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThat(convocatoriaService.cerrar(999L)).isNull();
            verify(convocatoriaRepository, never()).save(any(Convocatoria.class));
        }
    }

    // ==================================================================
    // EDICION
    // ==================================================================

    @Nested
    @DisplayName("Edicion de convocatorias")
    class Edicion {

        @Test
        @DisplayName("editar actualiza todos los campos editables")
        void editaTodosLosCampos() {
            Convocatoria existente = nueva(1L, "Nombre viejo", "BORRADOR");
            existente.setRequisitos("Requisitos viejos");
            when(convocatoriaRepository.findById(1L)).thenReturn(Optional.of(existente));
            when(convocatoriaRepository.save(existente)).thenReturn(existente);

            ConvocatoriaRequest cambios = new ConvocatoriaRequest();
            cambios.setNombre("Nombre actualizado");
            cambios.setTipoBeca("DEPORTIVA");
            cambios.setRequisitos("Requisitos actualizados");
            cambios.setBeneficio("Beneficio actualizado");
            cambios.setFechaApertura(LocalDate.of(2026, 10, 1));
            cambios.setFechaCierre(LocalDate.of(2026, 11, 15));

            Convocatoria resultado = convocatoriaService.editar(1L, cambios);

            assertThat(resultado.getNombre()).isEqualTo("Nombre actualizado");
            assertThat(resultado.getTipoBeca()).isEqualTo("DEPORTIVA");
            assertThat(resultado.getRequisitos()).isEqualTo("Requisitos actualizados");
            assertThat(resultado.getBeneficio()).isEqualTo("Beneficio actualizado");
            assertThat(resultado.getFechaApertura()).isEqualTo(LocalDate.of(2026, 10, 1));
            assertThat(resultado.getFechaCierre()).isEqualTo(LocalDate.of(2026, 11, 15));
        }

        @Test
        @DisplayName("editar no altera el id ni el estado de la convocatoria")
        void editarNoAlteraIdNiEstado() {
            Convocatoria existente = nueva(1L, "Nombre viejo", "PUBLICADA");
            when(convocatoriaRepository.findById(1L)).thenReturn(Optional.of(existente));
            when(convocatoriaRepository.save(existente)).thenReturn(existente);

            Convocatoria resultado = convocatoriaService.editar(1L, request);

            assertThat(resultado.getId()).isEqualTo(1L);
            assertThat(resultado.getEstado()).isEqualTo("PUBLICADA");
        }

        @Test
        @DisplayName("editar un id inexistente devuelve null y no guarda nada")
        void editarIdInexistenteNoGuarda() {
            when(convocatoriaRepository.findById(999L)).thenReturn(Optional.empty());

            assertThat(convocatoriaService.editar(999L, request)).isNull();
            verify(convocatoriaRepository, never()).save(any(Convocatoria.class));
        }
    }
}
