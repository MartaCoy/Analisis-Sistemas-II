package com.becas.backend.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * La notificación interna ya se guarda en la BD en la misma transacción
 * que el historial. Este listener solo observa el evento confirmado;
 * no simula un correo electrónico.
 */
@Component
public class NotificacionListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alCambiarEstado(SolicitudEstadoCambiadoEvent evento) {
        // Punto de extensión para integraciones futuras (SMTP, mensajería, etc.).
    }
}
