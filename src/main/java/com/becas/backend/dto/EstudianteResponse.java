package com.becas.backend.dto;

import com.becas.backend.model.Estudiante;

public class EstudianteResponse {
    private Long id;
    private String nombreCompleto;
    private String correo;
    private String carnet;
    private String rol;

    public EstudianteResponse(Estudiante estudiante) {
        this.id = estudiante.getId();
        this.nombreCompleto = estudiante.getNombreCompleto();
        this.correo = estudiante.getCorreo();
        this.carnet = estudiante.getCarnet();
        this.rol = estudiante.getRol();
    }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getCorreo() { return correo; }
    public String getCarnet() { return carnet; }
    public String getRol() { return rol; }
}