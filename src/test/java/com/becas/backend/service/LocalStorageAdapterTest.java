package com.becas.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 3 - Patron Adapter aplicado al almacenamiento de archivos.
 *
 * Se prueba la implementacion real contra un directorio temporal que JUnit
 * crea y borra solo, por lo que no se toca la carpeta uploads del proyecto.
 * La ruta base se inyecta con ReflectionTestUtils porque viene de @Value y
 * estas pruebas no levantan el contexto de Spring.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@DisplayName("LocalStorageAdapter - almacenamiento local de documentos")
class LocalStorageAdapterTest {

    @TempDir
    Path carpetaTemporal;

    private LocalStorageAdapter adapter;

    @BeforeEach
    void inicializar() {
        adapter = new LocalStorageAdapter();
        ReflectionTestUtils.setField(adapter, "basePath", carpetaTemporal.toString());
    }

    private MockMultipartFile archivo(String nombre, String contenido) {
        return new MockMultipartFile("archivo", nombre, "application/pdf", contenido.getBytes());
    }

    @Test
    @DisplayName("Implementa la interfaz StorageAdapter (patron Adapter)")
    void implementaLaInterfaz() {
        assertThat(adapter).isInstanceOf(StorageAdapter.class);
    }

    @Test
    @DisplayName("Guarda el archivo en disco y devuelve su ruta")
    void guardaElArchivoYDevuelveLaRuta() {
        String ruta = adapter.subirArchivo(archivo("constancia.pdf", "contenido"), "solicitud_1");

        assertThat(ruta).isNotBlank();
        assertThat(Path.of(ruta)).exists();
    }

    @Test
    @DisplayName("Crea la carpeta de destino si todavia no existe")
    void creaLaCarpetaDeDestino() {
        Path destino = carpetaTemporal.resolve("solicitud_42");
        assertThat(destino).doesNotExist();

        adapter.subirArchivo(archivo("constancia.pdf", "contenido"), "solicitud_42");

        assertThat(destino).exists().isDirectory();
    }

    @Test
    @DisplayName("El contenido guardado coincide con el del archivo original")
    void conservaElContenido() throws Exception {
        String ruta = adapter.subirArchivo(
                archivo("constancia.pdf", "texto de la constancia"), "solicitud_1");

        assertThat(Files.readString(Path.of(ruta))).isEqualTo("texto de la constancia");
    }

    @Test
    @DisplayName("Antepone un identificador unico para no pisar archivos homonimos")
    void anteponeIdentificadorUnico() {
        String primera = adapter.subirArchivo(archivo("constancia.pdf", "primero"), "solicitud_1");
        String segunda = adapter.subirArchivo(archivo("constancia.pdf", "segundo"), "solicitud_1");

        assertThat(primera).isNotEqualTo(segunda);
        assertThat(Path.of(primera)).exists();
        assertThat(Path.of(segunda)).exists();
        assertThat(Path.of(primera).getFileName().toString()).endsWith("_constancia.pdf");
    }

    @Test
    @DisplayName("Separa los archivos por carpeta de solicitud")
    void separaPorCarpetaDeSolicitud() {
        String unaSolicitud = adapter.subirArchivo(archivo("a.pdf", "x"), "solicitud_1");
        String otraSolicitud = adapter.subirArchivo(archivo("b.pdf", "y"), "solicitud_2");

        assertThat(Path.of(unaSolicitud).getParent().getFileName().toString())
                .isEqualTo("solicitud_1");
        assertThat(Path.of(otraSolicitud).getParent().getFileName().toString())
                .isEqualTo("solicitud_2");
    }
}
