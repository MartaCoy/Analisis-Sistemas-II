package com.becas.backend.dto;

import com.becas.backend.model.Solicitud;
import java.util.List;

public record PanelEvaluadorResponse(
    Long evaluadorId,
    List<Solicitud> solicitudes
) {}
