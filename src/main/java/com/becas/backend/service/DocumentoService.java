package com.becas.backend.service;

import com.becas.backend.model.Documento;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.DocumentoRepository;
import com.becas.backend.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@Service
public class DocumentoService {

    private static final long TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;
    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("pdf", "jpg", "jpeg", "png");

    @Autowired
    private StorageAdapter storageAdapter;

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    public Documento subirDocumento(Long solicitudId, MultipartFile archivo, String tipoDocumento, Long estudianteId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));

        if (archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío.");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo permitido (5MB).");
        }
        String nombreOriginal = archivo.getOriginalFilename();
        String extension = nombreOriginal != null && nombreOriginal.contains(".")
                ? nombreOriginal.substring(nombreOriginal.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!EXTENSIONES_PERMITIDAS.contains(extension)) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, PNG.");
        }

        if (!solicitud.getEstudianteId().equals(estudianteId)) {
            throw new IllegalStateException("No podés subir documentos a una solicitud que no es tuya.");
        }

        String url = storageAdapter.subirArchivo(archivo, "solicitud_" + solicitudId);

        Documento documento = new Documento();
        documento.setSolicitudId(solicitudId);
        documento.setNombreArchivo(archivo.getOriginalFilename());
        documento.setUrlS3(url);
        documento.setTipoDocumento(tipoDocumento);

        return documentoRepository.save(documento);
    }

    public List<Documento> listarPorSolicitud(Long solicitudId) {
        return documentoRepository.findBySolicitudId(solicitudId);
    }
}