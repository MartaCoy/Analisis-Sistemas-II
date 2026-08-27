package com.becas.backend.dto;

public class AuthResponse {
    private String token;
    private String nombreCompleto;
    private String correo;
    private String rol;

    public AuthResponse(String token, String nombreCompleto, String correo, String rol) {
        this.token = token;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
        this.rol = rol;
    }

    public String getToken() { return token; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getCorreo() { return correo; }
    public String getRol() { return rol; }
}