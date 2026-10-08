package com.becas.backend.controller;

import com.becas.backend.dto.ReporteBecasResponse;
import com.becas.backend.service.ReporteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @GetMapping("/becas")
    public ReporteBecasResponse generarReporteBecas() {
        return reporteService.generarReporte();
    }
}
