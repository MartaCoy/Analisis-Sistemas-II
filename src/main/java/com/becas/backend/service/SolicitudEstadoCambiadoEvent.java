package com.becas.backend.service;

/** Evento de dominio publicado solo tras confirmar una transición. */
public record SolicitudEstadoCambiadoEvent(
    Long solicitudId, Long estudianteId, String anterior, String nuevo
) {}
