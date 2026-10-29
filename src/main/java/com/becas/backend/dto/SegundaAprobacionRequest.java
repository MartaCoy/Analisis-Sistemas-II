package com.becas.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SegundaAprobacionRequest(
    @NotNull Boolean aprobada,
    @Size(max = 500) String observacion
) {}
