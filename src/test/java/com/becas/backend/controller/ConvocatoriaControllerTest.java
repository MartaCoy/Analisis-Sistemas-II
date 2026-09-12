package com.becas.backend.controller;

import com.becas.backend.dto.ConvocatoriaRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.service.ConvocatoriaService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 2 - HU-04 / HU-05: endpoints REST de convocatorias.
 *
 * Verifica que cada endpoint delegue en el metodo correcto del servicio y
 * devuelva lo que el servicio entrega, sin transformarlo por el camino.
 * El servicio esta simulado con Mockito.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConvocatoriaController - endpoints de convocatorias")
class ConvocatoriaControllerTest {

    @Mock
    private ConvocatoriaService convocatoriaService;

    @InjectMocks
    private ConvocatoriaController convocatoriaController;

    private Convocatoria convocatoria;
    private ConvocatoriaRequest request;

    @BeforeEach
    void prepararDatos() {
        convocatoria = new Convocatoria();
        convocatoria.setId(1L);
        convocatoria.setNombre("Beca de Excelencia Academica 2026");
        convocatoria.setTipoBeca("ACADEMICA");
        convocatoria.setEstado("PUBLICADA");

        request = new ConvocatoriaRequest();
        request.setNombre("Beca de Excelencia Academica 2026");
        request.setTipoBeca("ACADEMICA");
        request.setFechaApertura(LocalDate.of(2026, 9, 15));
        request.setFechaCierre(LocalDate.of(2026, 10, 30));
    }

    @Test
    @DisplayName("GET /activas delega en listarActivas, no en listarTodas")
    void listarActivasDelegaEnElServicio() {
        when(convocatoriaService.listarActivas()).thenReturn(List.of(convocatoria));

        List<Convocatoria> resultado = convocatoriaController.listarActivas();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getEstado()).isEqualTo("PUBLICADA");
        verify(convocatoriaService).listarActivas();
        verify(convocatoriaService, never()).listarTodas();
    }

    @Test
    @DisplayName("GET raiz delega en listarTodas")
    void listarTodasDelegaEnElServicio() {
        when(convocatoriaService.listarTodas()).thenReturn(List.of(convocatoria));

        assertThat(convocatoriaController.listarTodas()).hasSize(1);
        verify(convocatoriaService).listarTodas();
        verify(convocatoriaService, never()).listarActivas();
    }

    @Test
    @DisplayName("GET /{id} devuelve la convocatoria que entrega el servicio")
    void obtenerDelegaEnElServicio() {
        when(convocatoriaService.obtener(1L)).thenReturn(convocatoria);

        Convocatoria resultado = convocatoriaController.obtener(1L);

        assertThat(resultado.getId()).isEqualTo(1L);
        verify(convocatoriaService).obtener(1L);
    }

    @Test
    @DisplayName("GET /{id} propaga el null del servicio cuando el id no existe")
    void obtenerPropagaNull() {
        when(convocatoriaService.obtener(999L)).thenReturn(null);

        assertThat(convocatoriaController.obtener(999L)).isNull();
    }

    @Test
    @DisplayName("POST crea la convocatoria pasando el request sin modificarlo")
    void crearPasaElRequestIntacto() {
        when(convocatoriaService.crear(request)).thenReturn(convocatoria);

        Convocatoria resultado = convocatoriaController.crear(request);

        assertThat(resultado.getId()).isEqualTo(1L);
        verify(convocatoriaService).crear(request);
    }

    @Test
    @DisplayName("PUT /{id}/publicar delega en publicar")
    void publicarDelegaEnElServicio() {
        when(convocatoriaService.publicar(1L)).thenReturn(convocatoria);

        assertThat(convocatoriaController.publicar(1L)).isNotNull();
        verify(convocatoriaService).publicar(1L);
        verify(convocatoriaService, never()).cerrar(anyLong());
    }

    @Test
    @DisplayName("PUT /{id}/cerrar delega en cerrar")
    void cerrarDelegaEnElServicio() {
        Convocatoria cerrada = new Convocatoria();
        cerrada.setId(1L);
        cerrada.setEstado("CERRADA");
        when(convocatoriaService.cerrar(1L)).thenReturn(cerrada);

        assertThat(convocatoriaController.cerrar(1L).getEstado()).isEqualTo("CERRADA");
        verify(convocatoriaService).cerrar(1L);
        verify(convocatoriaService, never()).publicar(anyLong());
    }

    @Test
    @DisplayName("PUT /{id} delega en editar con el id y el request recibidos")
    void editarDelegaEnElServicio() {
        when(convocatoriaService.editar(1L, request)).thenReturn(convocatoria);

        assertThat(convocatoriaController.editar(1L, request)).isNotNull();
        verify(convocatoriaService).editar(1L, request);
    }

    @Test
    @DisplayName("PUT /{id} propaga el null del servicio cuando el id no existe")
    void editarPropagaNull() {
        when(convocatoriaService.editar(eq(999L), any(ConvocatoriaRequest.class))).thenReturn(null);

        assertThat(convocatoriaController.editar(999L, request)).isNull();
    }
}
