package com.becas.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "aprobaciones_solicitud", uniqueConstraints = {
    @UniqueConstraint(name = "uq_aprobacion_solicitud_etapa", columnNames = {"solicitud_id", "etapa"})
})
public class AprobacionSolicitud {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "solicitud_id", nullable = false) private Long solicitudId;
    @Column(nullable = false) private int etapa;
    @Column(name = "actor_correo", nullable = false) private String actorCorreo;
    @Column(nullable = false) private String decision;
    @Column(length = 500) private String observacion;
    @Column(nullable = false) private LocalDateTime fecha = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Long solicitudId) { this.solicitudId = solicitudId; }
    public int getEtapa() { return etapa; }
    public void setEtapa(int etapa) { this.etapa = etapa; }
    public String getActorCorreo() { return actorCorreo; }
    public void setActorCorreo(String actorCorreo) { this.actorCorreo = actorCorreo; }
    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public LocalDateTime getFecha() { return fecha; }
}
