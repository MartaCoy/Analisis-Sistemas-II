package com.becas.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import com.becas.backend.validation.ContrasenaRegistro;

public class RegistroRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 255, message = "El campo admite hasta 255 caracteres.")
    private String nombreCompleto;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El formato del correo no es válido")
    @Size(max = 255, message = "El campo admite hasta 255 caracteres.")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @ContrasenaRegistro
    private String password;

    @NotBlank(message = "El carnet es obligatorio")
    @Size(max = 255, message = "El campo admite hasta 255 caracteres.")
    private String carnet;

    @NotNull(message = "Selecciona tu universidad.")
    @Positive(message = "Selecciona una universidad válida.")
    private Long universidadId;

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCarnet() { return carnet; }
    public void setCarnet(String carnet) { this.carnet = carnet; }

    public Long getUniversidadId() { return universidadId; }
    public void setUniversidadId(Long universidadId) { this.universidadId = universidadId; }
}