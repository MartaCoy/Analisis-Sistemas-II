package com.becas.backend.service;

import com.becas.backend.model.Convocatoria;
import com.becas.backend.model.ConvocatoriaBuilder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class ConvocatoriaFactory {

    public Convocatoria crearAcademica(String nombre, String requisitos, LocalDate apertura, LocalDate cierre) {
        return new ConvocatoriaBuilder()
                .nombre(nombre).tipoBeca("ACADEMICA").requisitos(requisitos)
                .fechaApertura(apertura).fechaCierre(cierre).build();
    }

    public Convocatoria crearDeportiva(String nombre, String requisitos, LocalDate apertura, LocalDate cierre) {
        return new ConvocatoriaBuilder()
                .nombre(nombre).tipoBeca("DEPORTIVA").requisitos(requisitos)
                .fechaApertura(apertura).fechaCierre(cierre).build();
    }

    public Convocatoria crearSocioeconomica(String nombre, String requisitos, LocalDate apertura, LocalDate cierre) {
        return new ConvocatoriaBuilder()
                .nombre(nombre).tipoBeca("SOCIOECONOMICA").requisitos(requisitos)
                .fechaApertura(apertura).fechaCierre(cierre).build();
    }
}