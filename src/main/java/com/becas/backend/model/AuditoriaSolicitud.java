package com.becas.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_solicitud")
public class AuditoriaSolicitud {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "solicitud_id", nullable = false) private Long solicitudId;
    @Column(name = "actor_correo", nullable = false) private String actorCorreo;
    @Column(nullable = false) private String operacion;
    @Column(nullable = false) private String resultado;
    @Column(length = 1000) private String detalle;
    @Column(nullable = false) private LocalDateTime fecha = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Long solicitudId) { this.solicitudId = solicitudId; }
    public String getActorCorreo() { return actorCorreo; }
    public void setActorCorreo(String actorCorreo) { this.actorCorreo = actorCorreo; }
    public String getOperacion() { return operacion; }
    public void setOperacion(String operacion) { this.operacion = operacion; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public LocalDateTime getFecha() { return fecha; }
}
