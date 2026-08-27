package com.becas.backend.controller;

import com.becas.backend.dto.ConvocatoriaRequest;
import com.becas.backend.model.Convocatoria;
import com.becas.backend.service.ConvocatoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/convocatorias")
public class ConvocatoriaController {

    @Autowired private ConvocatoriaService convocatoriaService;

    @GetMapping("/activas")
    public List<Convocatoria> listarActivas() { return convocatoriaService.listarActivas(); }

    @GetMapping
    public List<Convocatoria> listarTodas() { return convocatoriaService.listarTodas(); }

    @GetMapping("/{id}")
    public Convocatoria obtener(@PathVariable Long id) { return convocatoriaService.obtener(id); }

    @PostMapping
    public Convocatoria crear(@RequestBody ConvocatoriaRequest request) { return convocatoriaService.crear(request); }

    @PutMapping("/{id}/publicar")
    public Convocatoria publicar(@PathVariable Long id) { return convocatoriaService.publicar(id); }

    @PutMapping("/{id}/cerrar")
    public Convocatoria cerrar(@PathVariable Long id) { return convocatoriaService.cerrar(id); }
}