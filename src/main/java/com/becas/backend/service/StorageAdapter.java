package com.becas.backend.service;
import org.springframework.core.io.Resource;

import org.springframework.web.multipart.MultipartFile;

public interface StorageAdapter {
    /**
     * Sube un archivo y devuelve la URL/ruta donde quedó guardado.
     */
    String subirArchivo(MultipartFile archivo, String carpetaDestino);
    // VISOR_DOCUMENTOS_PROTEGIDOS_V1
    Resource obtenerArchivo(String rutaGuardada, String carpetaDestino);
}