package com.becas.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "comites")
public class Comite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "tipo_beca", nullable = false)
    private String tipoBeca;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipoBeca() { return tipoBeca; }
    public void setTipoBeca(String tipoBeca) { this.tipoBeca = tipoBeca; }
}