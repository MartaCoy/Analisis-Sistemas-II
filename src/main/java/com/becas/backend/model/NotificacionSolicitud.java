package com.becas.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones_solicitud")
public class NotificacionSolicitud {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "solicitud_id", nullable = false) private Long solicitudId;
    @Column(name = "estudiante_id", nullable = false) private Long estudianteId;
    @Column(name = "estado_nuevo", nullable = false) private String estadoNuevo;
    @Column(nullable = false, length = 500) private String mensaje;
    @Column(nullable = false) private LocalDateTime fecha = LocalDateTime.now();
    @Column(nullable = false) private boolean leida = false;

    public Long getId() { return id; }
    public Long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Long solicitudId) { this.solicitudId = solicitudId; }
    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }
    public String getEstadoNuevo() { return estadoNuevo; }
    public void setEstadoNuevo(String estadoNuevo) { this.estadoNuevo = estadoNuevo; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public LocalDateTime getFecha() { return fecha; }
    public boolean isLeida() { return leida; }
    public void setLeida(boolean leida) { this.leida = leida; }
}
