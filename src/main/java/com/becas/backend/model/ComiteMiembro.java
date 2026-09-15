package com.becas.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "comite_miembros")
public class ComiteMiembro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "comite_id", nullable = false)
    private Long comiteId;

    @Column(name = "estudiante_id", nullable = false)
    private Long estudianteId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getComiteId() { return comiteId; }
    public void setComiteId(Long comiteId) { this.comiteId = comiteId; }
    public Long getEstudianteId() { return estudianteId; }
    public void setEstudianteId(Long estudianteId) { this.estudianteId = estudianteId; }
}