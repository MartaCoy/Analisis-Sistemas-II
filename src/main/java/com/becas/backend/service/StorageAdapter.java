package com.becas.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageAdapter {
    /**
     * Sube un archivo y devuelve la URL/ruta donde quedó guardado.
     */
    String subirArchivo(MultipartFile archivo, String carpetaDestino);
}