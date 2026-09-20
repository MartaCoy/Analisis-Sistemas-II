package com.becas.backend.service;

/**
 * Se publica cuando una solicitud queda APROBADA o RECHAZADA.
 * Es el punto de enganche para el Observer de notificaciones (@EventListener).
 */
public record SolicitudResueltaEvent(Long solicitudId, Long estudianteId, String estadoFinal) {}