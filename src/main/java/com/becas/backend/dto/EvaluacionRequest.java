package com.becas.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class EvaluacionRequest {
    @NotNull(message = "El puntaje es obligatorio")
    @Min(value = 0, message = "El puntaje mínimo es 0")
    @Max(value = 100, message = "El puntaje máximo es 100")
    private Integer puntaje;

    @Size(max = 1000, message = "Las observaciones no pueden pasar de 1000 caracteres")
    private String observaciones;

    public Integer getPuntaje() { return puntaje; }
    public void setPuntaje(Integer puntaje) { this.puntaje = puntaje; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}