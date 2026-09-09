package com.becas.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalStorageAdapter implements StorageAdapter {

    @Value("${app.storage.local.path:uploads}")
    private String basePath;

    @Override
    public String subirArchivo(MultipartFile archivo, String carpetaDestino) {
        try {
            Path carpeta = Paths.get(basePath, carpetaDestino);
            Files.createDirectories(carpeta);

            String nombreUnico = UUID.randomUUID() + "_" + archivo.getOriginalFilename();
            Path destino = carpeta.resolve(nombreUnico);
            archivo.transferTo(destino);

            return destino.toString();
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el archivo: " + e.getMessage());
        }
    }
}