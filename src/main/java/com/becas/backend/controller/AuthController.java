package com.becas.backend.controller;

import com.becas.backend.config.JwtService;
import com.becas.backend.dto.AuthResponse;
import com.becas.backend.dto.LoginRequest;
import com.becas.backend.dto.RegistroRequest;
import com.becas.backend.model.Estudiante;
import com.becas.backend.repository.EstudianteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private EstudianteRepository estudianteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@RequestBody RegistroRequest request) {
        if (estudianteRepository.findByCorreo(request.getCorreo()).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe un estudiante con ese correo.");
        }

        Estudiante estudiante = new Estudiante();
        estudiante.setNombreCompleto(request.getNombreCompleto());
        estudiante.setCorreo(request.getCorreo());
        estudiante.setPassword(passwordEncoder.encode(request.getPassword()));
        estudiante.setCarnet(request.getCarnet());

        estudianteRepository.save(estudiante);

        String token = jwtService.generarToken(estudiante.getCorreo(), estudiante.getRol());
        return ResponseEntity.ok(new AuthResponse(token, estudiante.getNombreCompleto(), estudiante.getCorreo(), estudiante.getRol()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Estudiante estudiante = estudianteRepository.findByCorreo(request.getCorreo())
                .orElse(null);

        if (estudiante == null || !passwordEncoder.matches(request.getPassword(), estudiante.getPassword())) {
            return ResponseEntity.status(401).body("Correo o contraseña incorrectos.");
        }

        String token = jwtService.generarToken(estudiante.getCorreo(), estudiante.getRol());
        return ResponseEntity.ok(new AuthResponse(token, estudiante.getNombreCompleto(), estudiante.getCorreo(), estudiante.getRol()));
    }
}