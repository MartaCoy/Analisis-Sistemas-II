package com.becas.backend.service;

import com.becas.backend.model.Documento;
import com.becas.backend.model.Solicitud;
import com.becas.backend.repository.DocumentoRepository;
import com.becas.backend.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class DocumentoService {

    @Autowired
    private StorageAdapter storageAdapter;

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    public Documento subirDocumento(Long solicitudId, MultipartFile archivo, String tipoDocumento, Long estudianteId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("La solicitud no existe."));

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