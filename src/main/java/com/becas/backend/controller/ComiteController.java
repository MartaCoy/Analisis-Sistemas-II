package com.becas.backend.controller;

import com.becas.backend.dto.ComiteRequest;
import com.becas.backend.dto.MiembroRequest;
import com.becas.backend.model.Comite;
import com.becas.backend.model.ComiteMiembro;
import com.becas.backend.service.ComiteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/comites")
public class ComiteController {

    @Autowired
    private ComiteService comiteService;

    @GetMapping
    public List<Comite> listarTodos() {
        return comiteService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody ComiteRequest request) {
        try {
            return ResponseEntity.ok(comiteService.crear(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/miembros")
    public ResponseEntity<?> agregarMiembro(@PathVariable Long id, @Valid @RequestBody MiembroRequest request) {
        try {
            ComiteMiembro miembro = comiteService.agregarMiembro(id, request.getEstudianteId());
            return ResponseEntity.ok(miembro);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/miembros")
    public List<ComiteMiembro> listarMiembros(@PathVariable Long id) {
        return comiteService.listarMiembros(id);
    }
}