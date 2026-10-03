package com.becas.backend.repository;
import com.becas.backend.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
    List<Solicitud> findByEstudianteId(Long estudianteId);
    Optional<Solicitud> findByEstudianteIdAndConvocatoriaId(Long estudianteId, Long convocatoriaId);

    @Query("""
        select s from Solicitud s
        where exists (
            select m.id from ComiteMiembro m
            where m.comiteId = s.comiteId
              and m.estudianteId = :evaluadorId
        )
        order by s.fechaSolicitud desc, s.id desc
        """)
    List<Solicitud> listarAsignadasParaEvaluador(
        @Param("evaluadorId") Long evaluadorId
    );
}
