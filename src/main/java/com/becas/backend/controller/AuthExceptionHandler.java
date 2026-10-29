package com.becas.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Solo autenticación: no expone trazas ni el valor rechazado de una contraseña. */
@RestControllerAdvice(assignableTypes = AuthController.class)
public class AuthExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException exception) {
        Map<String, String> errores = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
            errores.putIfAbsent(error.getField(), error.getDefaultMessage() == null
                ? "Revisa este campo." : error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("code", "VALIDACION_FALLIDA",
            "message", "Revisa los campos indicados.", "errors", errores));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> formato() {
        return ResponseEntity.badRequest().body(Map.of("code", "DATOS_INVALIDOS",
            "message", "No pudimos leer el formulario. Revisa los datos e intenta nuevamente."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> conflicto() {
        return ResponseEntity.status(409).body(Map.of("code", "REGISTRO_NO_COMPLETADO",
            "message", "No pudimos crear la cuenta con esos datos. Revísalos o inicia sesión si ya te registraste."));
    }
}
