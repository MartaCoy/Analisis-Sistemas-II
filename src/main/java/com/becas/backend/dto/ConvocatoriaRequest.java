package com.becas.backend.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

public class ConvocatoriaRequest {
    private String nombre;
    private String tipoBeca;
    private String requisitos;
    private String beneficio;
    private BigDecimal montoBeca;
    private LocalDate fechaApertura;
    private LocalDate fechaCierre;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipoBeca() { return tipoBeca; }
    public void setTipoBeca(String tipoBeca) { this.tipoBeca = tipoBeca; }
    public String getRequisitos() { return requisitos; }
    public void setRequisitos(String requisitos) { this.requisitos = requisitos; }
    public BigDecimal getMontoBeca() { return montoBeca; }
    public void setMontoBeca(BigDecimal montoBeca) { this.montoBeca = montoBeca; }
    public String getBeneficio() { return beneficio; }
    public void setBeneficio(String beneficio) { this.beneficio = beneficio; }
    public LocalDate getFechaApertura() { return fechaApertura; }
    public void setFechaApertura(LocalDate fechaApertura) { this.fechaApertura = fechaApertura; }
    public LocalDate getFechaCierre() { return fechaCierre; }
    public void setFechaCierre(LocalDate fechaCierre) { this.fechaCierre = fechaCierre; }
}