package com.becas.backend.model;

import java.time.LocalDate;

public class ConvocatoriaBuilder {
    private final Convocatoria convocatoria = new Convocatoria();

    public ConvocatoriaBuilder nombre(String nombre) { convocatoria.setNombre(nombre); return this; }
    public ConvocatoriaBuilder tipoBeca(String tipoBeca) { convocatoria.setTipoBeca(tipoBeca); return this; }
    public ConvocatoriaBuilder requisitos(String requisitos) { convocatoria.setRequisitos(requisitos); return this; }
    public ConvocatoriaBuilder fechaApertura(LocalDate fecha) { convocatoria.setFechaApertura(fecha); return this; }
    public ConvocatoriaBuilder fechaCierre(LocalDate fecha) { convocatoria.setFechaCierre(fecha); return this; }

    public Convocatoria build() { return convocatoria; }
}