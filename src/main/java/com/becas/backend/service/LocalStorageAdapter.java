package com.becas.backend.service;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

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


    // VISOR_DOCUMENTOS_PROTEGIDOS_V1
    @Override
    public Resource obtenerArchivo(String rutaGuardada, String carpetaDestino) {
        if (rutaGuardada == null || rutaGuardada.isBlank() || carpetaDestino == null
                || !carpetaDestino.matches("solicitud_[0-9]+")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        try {
            Path base = Paths.get(basePath).toAbsolutePath().normalize();
            Path carpeta = base.resolve(carpetaDestino).normalize();
            Path archivo = Paths.get(rutaGuardada).toAbsolutePath().normalize();
            if (!carpeta.getParent().equals(base) || !archivo.getParent().equals(carpeta)
                    || !Files.isRegularFile(archivo, LinkOption.NOFOLLOW_LINKS)
                    || !Files.isReadable(archivo)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            Path baseReal = base.toRealPath();
            Path carpetaReal = carpeta.toRealPath();
            Path archivoReal = archivo.toRealPath();
            if (!carpetaReal.getParent().equals(baseReal)
                    || !archivoReal.getParent().equals(carpetaReal)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            return new FileSystemResource(archivoReal);
        } catch (java.io.IOException | InvalidPathException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

}