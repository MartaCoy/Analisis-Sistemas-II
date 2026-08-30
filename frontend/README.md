# Sistema Nacional de Becas - Frontend

Frontend del Sistema Nacional de Becas desarrollado con React y Vite.

## HU-01 - Registro de estudiante

Este módulo permite crear una cuenta de estudiante mediante los siguientes datos:

- Nombre completo
- Carnet
- Correo electrónico
- Contraseña

El formulario incluye validación de campos obligatorios, formato de correo electrónico y nivel de seguridad de la contraseña.

El registro se comunica con el backend mediante:

POST /api/auth/registro

Durante el desarrollo, Vite utiliza un proxy hacia el backend Spring Boot ejecutado en:

http://localhost:8090

## Ejecutar el proyecto

Instalar dependencias:

```bash
npm install