package com.becas.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documentos")
public class Documento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "solicitud_id", nullable = false)
    private Long solicitudId;
    
    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;
    
    @Column(name = "url_s3", nullable = false)
    private String urlS3;
    
    @Column(name = "tipo_documento")
    private String tipoDocumento; 
    
    @Column(name = "fecha_carga")
    private LocalDateTime fechaCarga = LocalDateTime.now();

    public Documento() {}

    // Getters
    public Long getId() {
        return id;
    }

    public Long getSolicitudId() {
        return solicitudId;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public String getUrlS3() {
        return urlS3;
    }

    public String getTipoDocumento() {
        return tipoDocumento;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setSolicitudId(Long solicitudId) {
        this.solicitudId = solicitudId;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public void setUrlS3(String urlS3) {
        this.urlS3 = urlS3;
    }

    public void setTipoDocumento(String tipoDocumento) {
        this.tipoDocumento = tipoDocumento;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }
}