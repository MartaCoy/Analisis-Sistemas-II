package com.becas.backend.service;

import com.becas.backend.model.Documento;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.DocumentoRepository;
import com.becas.backend.repository.SolicitudRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * SENCAM - Sistema de Becas MINEDUC
 * Sprint 3 - HU-07: carga de documentos y validacion.
 *
 * Cubre los casos limite pedidos en la tarjeta: formato invalido y tamano
 * excedido, mas los de solicitud inexistente, archivo vacio y propiedad de
 * la solicitud. El repositorio y el StorageAdapter se sustituyen por dobles
 * de prueba, por lo que nada se escribe en disco ni en PostgreSQL.
 *
 * Autor: Edwin Daniel Mendez Castro (Desarrollador 2)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentoService - carga y validacion de documentos")
class DocumentoServiceTest {

    @Mock
    private StorageAdapter storageAdapter;

    @Mock
    private DocumentoRepository documentoRepository;

    @Mock
    private SolicitudRepository solicitudRepository;

    @InjectMocks
    private DocumentoService documentoService;

    private static final Long SOLICITUD_ID = 1L;
    private static final Long ESTUDIANTE_ID = 10L;
    private static final long CINCO_MB = 5L * 1024 * 1024;
    private static final String RUTA_GUARDADA = "uploads/solicitud_1/uuid_constancia.pdf";

    private Solicitud solicitud;

    @BeforeEach
    void prepararDatos() {
        solicitud = new Solicitud();
        solicitud.setId(SOLICITUD_ID);
        solicitud.setEstudianteId(ESTUDIANTE_ID);
        solicitud.setConvocatoriaId(5L);
    }

    /** Archivo de prueba pequeno con el nombre indicado. */
    private MockMultipartFile archivo(String nombre) {
        return new MockMultipartFile(
                "archivo", nombre, "application/octet-stream", "contenido de prueba".getBytes());
    }

    // ==================================================================
    // CARGA EXITOSA
    // ==================================================================

    @Nested
    @DisplayName("Carga exitosa")
    class CargaExitosa {

        @Test
        @DisplayName("Guarda el documento y devuelve la entidad persistida")
        void subeDocumentoValido() {
            MockMultipartFile pdf = archivo("constancia.pdf");
            Documento persistido = new Documento();
            persistido.setId(100L);

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));
            when(storageAdapter.subirArchivo(pdf, "solicitud_1")).thenReturn(RUTA_GUARDADA);
            when(documentoRepository.save(any(Documento.class))).thenReturn(persistido);

            Documento resultado = documentoService.subirDocumento(
                    SOLICITUD_ID, pdf, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID);

            assertThat(resultado).isNotNull();
            assertThat(resultado.getId()).isEqualTo(100L);
            verify(storageAdapter).subirArchivo(pdf, "solicitud_1");
            verify(documentoRepository).save(any(Documento.class));
        }

        @Test
        @DisplayName("El documento guardado conserva solicitud, nombre, url y tipo")
        void mapeaCorrectamenteLosDatos() {
            MockMultipartFile pdf = archivo("constancia.pdf");

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));
            when(storageAdapter.subirArchivo(any(), anyString())).thenReturn(RUTA_GUARDADA);
            when(documentoRepository.save(any(Documento.class))).thenReturn(new Documento());

            documentoService.subirDocumento(SOLICITUD_ID, pdf, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID);

            ArgumentCaptor<Documento> captor = ArgumentCaptor.forClass(Documento.class);
            verify(documentoRepository).save(captor.capture());

            Documento guardado = captor.getValue();
            assertThat(guardado.getSolicitudId()).isEqualTo(SOLICITUD_ID);
            assertThat(guardado.getNombreArchivo()).isEqualTo("constancia.pdf");
            assertThat(guardado.getUrlS3()).isEqualTo(RUTA_GUARDADA);
            assertThat(guardado.getTipoDocumento()).isEqualTo("CONSTANCIA_ESTUDIOS");
            assertThat(guardado.getFechaCarga()).isNotNull();
        }

        @ParameterizedTest(name = "extension permitida: {0}")
        @DisplayName("Acepta los cuatro formatos permitidos")
        @ValueSource(strings = {"constancia.pdf", "foto.jpg", "foto.jpeg", "captura.png"})
        void aceptaFormatosPermitidos(String nombre) {
            MockMultipartFile valido = archivo(nombre);

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));
            when(storageAdapter.subirArchivo(any(), anyString())).thenReturn(RUTA_GUARDADA);
            when(documentoRepository.save(any(Documento.class))).thenReturn(new Documento());

            assertThatCode(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, valido, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("La extension se valida sin distinguir mayusculas")
        void aceptaExtensionEnMayusculas() {
            MockMultipartFile mayusculas = archivo("CONSTANCIA.PDF");

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));
            when(storageAdapter.subirArchivo(any(), anyString())).thenReturn(RUTA_GUARDADA);
            when(documentoRepository.save(any(Documento.class))).thenReturn(new Documento());

            assertThatCode(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, mayusculas, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Un archivo de exactamente 5MB se acepta (el limite no es excluyente)")
        void aceptaArchivoEnElLimiteExacto() {
            MultipartFile enElLimite = mock(MultipartFile.class);
            when(enElLimite.isEmpty()).thenReturn(false);
            when(enElLimite.getSize()).thenReturn(CINCO_MB);
            when(enElLimite.getOriginalFilename()).thenReturn("constancia.pdf");

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));
            when(storageAdapter.subirArchivo(any(), anyString())).thenReturn(RUTA_GUARDADA);
            when(documentoRepository.save(any(Documento.class))).thenReturn(new Documento());

            assertThatCode(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, enElLimite, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .doesNotThrowAnyException();
        }
    }

    // ==================================================================
    // CASO LIMITE: TAMANO EXCEDIDO
    // ==================================================================

    @Nested
    @DisplayName("Caso limite: tamano excedido")
    class TamanoExcedido {

        @Test
        @DisplayName("Rechaza un archivo que supera los 5MB por un solo byte")
        void rechazaArchivoDemasiadoGrande() {
            MultipartFile pesado = mock(MultipartFile.class);
            when(pesado.isEmpty()).thenReturn(false);
            when(pesado.getSize()).thenReturn(CINCO_MB + 1);

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, pesado, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("5MB");
        }

        @Test
        @DisplayName("Un archivo excedido no se guarda ni se envia al almacenamiento")
        void archivoExcedidoNoSePersiste() {
            MultipartFile pesado = mock(MultipartFile.class);
            when(pesado.isEmpty()).thenReturn(false);
            when(pesado.getSize()).thenReturn(20L * 1024 * 1024);

            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, pesado, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class);

            verifyNoInteractions(storageAdapter);
            verify(documentoRepository, never()).save(any(Documento.class));
        }
    }

    // ==================================================================
    // CASO LIMITE: FORMATO INVALIDO
    // ==================================================================

    @Nested
    @DisplayName("Caso limite: formato invalido")
    class FormatoInvalido {

        @ParameterizedTest(name = "formato rechazado: {0}")
        @DisplayName("Rechaza extensiones fuera de la lista permitida")
        @ValueSource(strings = {
                "malicioso.exe",
                "documento.docx",
                "hoja.xlsx",
                "script.sh",
                "comprimido.zip",
                "pagina.html"
        })
        void rechazaExtensionNoPermitida(String nombre) {
            MockMultipartFile invalido = archivo(nombre);
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, invalido, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no permitido");
        }

        @Test
        @DisplayName("Rechaza un archivo sin extension")
        void rechazaArchivoSinExtension() {
            MockMultipartFile sinExtension = archivo("archivo_sin_punto");
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, sinExtension, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Un formato invalido no se guarda ni se envia al almacenamiento")
        void formatoInvalidoNoSePersiste() {
            MockMultipartFile invalido = archivo("malicioso.exe");
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, invalido, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class);

            verifyNoInteractions(storageAdapter);
            verify(documentoRepository, never()).save(any(Documento.class));
        }

        @Test
        @DisplayName("Solo pesa la ultima extension del nombre del archivo")
        void evaluaLaUltimaExtension() {
            MockMultipartFile doblExtension = archivo("constancia.pdf.exe");
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, doblExtension, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ==================================================================
    // OTRAS VALIDACIONES
    // ==================================================================

    @Nested
    @DisplayName("Otras validaciones")
    class OtrasValidaciones {

        @Test
        @DisplayName("Rechaza la carga si la solicitud no existe")
        void rechazaSolicitudInexistente() {
            MockMultipartFile pdf = archivo("constancia.pdf");
            when(solicitudRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    999L, pdf, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no existe");

            verifyNoInteractions(storageAdapter, documentoRepository);
        }

        @Test
        @DisplayName("Rechaza un archivo vacio")
        void rechazaArchivoVacio() {
            MockMultipartFile vacio = new MockMultipartFile(
                    "archivo", "constancia.pdf", "application/pdf", new byte[0]);
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, vacio, "CONSTANCIA_ESTUDIOS", ESTUDIANTE_ID))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("vac");

            verifyNoInteractions(storageAdapter);
        }

        @Test
        @DisplayName("Un estudiante no puede subir documentos a la solicitud de otro")
        void rechazaSolicitudDeOtroEstudiante() {
            MockMultipartFile pdf = archivo("constancia.pdf");
            when(solicitudRepository.findById(SOLICITUD_ID)).thenReturn(Optional.of(solicitud));

            Long otroEstudiante = 99L;

            assertThatThrownBy(() -> documentoService.subirDocumento(
                    SOLICITUD_ID, pdf, "CONSTANCIA_ESTUDIOS", otroEstudiante))
                    .isInstanceOf(IllegalStateException.class);

            verifyNoInteractions(storageAdapter);
            verify(documentoRepository, never()).save(any(Documento.class));
        }
    }

    // ==================================================================
    // LISTADO
    // ==================================================================

    @Nested
    @DisplayName("Listado de documentos")
    class Listado {

        @Test
        @DisplayName("listarPorSolicitud devuelve los documentos de esa solicitud")
        void listaDocumentosDeLaSolicitud() {
            Documento uno = new Documento();
            uno.setSolicitudId(SOLICITUD_ID);
            Documento dos = new Documento();
            dos.setSolicitudId(SOLICITUD_ID);

            when(documentoRepository.findBySolicitudId(SOLICITUD_ID)).thenReturn(List.of(uno, dos));

            List<Documento> resultado = documentoService.listarPorSolicitud(SOLICITUD_ID);

            assertThat(resultado).hasSize(2);
            assertThat(resultado).allMatch(d -> SOLICITUD_ID.equals(d.getSolicitudId()));
        }

        @Test
        @DisplayName("listarPorSolicitud devuelve lista vacia si no hay documentos")
        void listaVaciaSiNoHayDocumentos() {
            when(documentoRepository.findBySolicitudId(SOLICITUD_ID)).thenReturn(List.of());

            assertThat(documentoService.listarPorSolicitud(SOLICITUD_ID)).isEmpty();
        }
    }
}
