package com.becas.backend.dto;

import jakarta.validation.constraints.NotNull;

public class MiembroRequest {
    @NotNull(message = "El estudianteId es obligatorio")
    private Long estudianteId;

    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }
}