package com.becas.backend.dto;

import jakarta.validation.constraints.NotNull;

public class SolicitudRequest {

    @NotNull(message = "El convocatoriaId es obligatorio")
    private Long convocatoriaId;

    public Long getConvocatoriaId() { return convocatoriaId; }
    public void setConvocatoriaId(Long convocatoriaId) { this.convocatoriaId = convocatoriaId; }
}