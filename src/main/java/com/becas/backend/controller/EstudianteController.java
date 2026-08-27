package com.becas.backend.controller;

import com.becas.backend.dto.EstudianteResponse;
import com.becas.backend.model.Estudiante;
import com.becas.backend.service.EstudianteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/estudiantes")
public class EstudianteController {

    @Autowired
    private EstudianteService estudianteService;

    @GetMapping
    public List<EstudianteResponse> listar() {
        return estudianteService.listarTodos()
                .stream()
                .map(EstudianteResponse::new)
                .collect(Collectors.toList());
    }

    @PostMapping
    public Estudiante crear(@RequestBody Estudiante estudiante) {
        return estudianteService.guardar(estudiante);
    }
}