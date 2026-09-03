# Minuta de Sprint Review & Retrospectiva - Sprint 1

**Proyecto:** Plataforma Nacional para la Gestión Integral de Becas  
**Fecha de Cierre:** 30 de agosto de 2026  
**Periodo:** 17 al 30 de agosto de 2026  
**Facilitador:** Sergio (Scrum Master)  
**Asistentes:** Marta, Sergio, Cristian, Alejandra, Edwin, Integrante 6, Ing. Mario Fuentes (PO)

---

## 1. Demostración y Revisión del Producto (Sprint Review)

### Historias de Usuario e Incremento Funcional
| ID / Tarea | Responsable | Estado | Feedback del Product Owner / Observaciones |
| :--- | :--- | :--- | :--- |
| **HU-01 (Backend):** Endpoint de registro de estudiante | SG | Completado | Validado endpoint de registro con estructura de DTOs. |
| **HU-02 (Backend):** Login con Spring Security + JWT | IO / MS | Completado | Implementado JWT. Se resolvió fix de variables de entorno (`jwt-secret-env`). |
| **HU-01 (Frontend):** Formulario de registro | CP | Completado | Interfaz conectada correctamente con la API. |
| **HU-02 (Frontend):** Formulario de login | SG | Completado | Manejo de tokens y redirección según estado de sesión. |
| **HU-03:** Gestión de roles (Estudiante, Evaluador, Admin) | SG | Completado | Control de acceso y autoridades configuradas. |
| **Pruebas Unitarias:** Servicios de autenticación | EC | Completado | Cobertura en servicios de login y registro con JUnit. |

---

## 2. Retrospectiva del Equipo

### ¿Qué salió bien?
* Excelente flujo de Pull Requests y Merges a la rama principal (se integraron correcciones como el PR #13 enviado por Marta).
* Módulo de autenticación (Frontend + Backend + BD) completado al 100% dentro del plazo del Sprint.
* Cumplimiento del plan de pruebas unitarias iniciales.

### ¿Qué se puede mejorar?
* Mantener alineados los nombres de las propiedades en el `application.properties` entre los entornos de todos los desarrolladores para evitar fallos de claves JWT locales.

### Acuerdos de Acción
1. Mantener un archivo `.env.example` o guía de propiedades actualizada en la raíz del repositorio.
2. Iniciar el Sprint 2 con el módulo de Administración de Convocatorias aplicando los patrones creacionales (Factory Method y Builder).

---

**Firma Scrum Master:** Sergio  
**Aprobado por PO:** Ing. Mario Fuentes
