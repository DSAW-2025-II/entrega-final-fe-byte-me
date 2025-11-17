[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/jRa9bpsE)

# Entrega final DSAW:

## URL Frontend: https://front-rouge-two.vercel.app/pages/login/landing

## URL Backend: https://back-zeta-cyan.vercel.app

## Nombre estudiante 1: Esteban Sequeda Henao (0000328378)

## Nombre estudiante 2: Sofy Alejandra Prada Murillo (0000336152)

# MODIFIQUE ESTE README AGREGANDO LA INFORMACIÓN QUE CONSIDERE PERTINENTE

# MoveTogether2 Frontend

Aplicación web para compartir viajes entre estudiantes de la Universidad de La Sabana. Permite a los usuarios crear viajes como conductores, buscar viajes disponibles como pasajeros, y gestionar sus viajes activos.

## Estado del Proyecto

**Versión:** 0.1.0  
**Estado:** En producción  
**Despliegue:** [https://front-rouge-two.vercel.app/pages/login/landing](https://front-rouge-two.vercel.app/pages/login/landing)

## Requisitos / Dependencias

### Lenguaje y Versión
- **Node.js:** 20.x o superior
- **TypeScript:** 5.x o superior

### Librerías y Frameworks
- **Next.js:** 16.0.1 - Framework React para producción
- **React:** 19.2.0 - Biblioteca de interfaz de usuario
- **React DOM:** 19.2.0 - Renderizado de React para web
- **Firebase:** ^12.5.0 - SDK de Firebase para autenticación y cliente

### Servicios Externos
- **Firebase Authentication:** Autenticación de usuarios
- **Firebase Firestore:** Base de datos (cliente)
- **Google Maps API:** Mapas y autocompletado de direcciones
- **Vercel:** Plataforma de despliegue

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Esteban9167/MoveTogether2-front.git
cd MoveTogether2-front
```

### 2. Instalar dependencias

```bash
npm install
```

## Uso Básico

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build de Producción

```bash
# Crear build de producción
npm run build

# Iniciar servidor de producción
npm start
```

## Características Principales

### Autenticación
- Login con Google OAuth
- Login con credenciales de la universidad
- Recuperación de contraseña
- Gestión de sesión con tokens JWT

### Gestión de Viajes
- **Modo Conductor:**
  - Crear viajes con origen, destino, fecha y hora
  - Configurar número de asientos y precio
  - Aceptar/rechazar solicitudes de pasajeros
  - Cancelar viajes
  - Contactar pasajeros por WhatsApp

- **Modo Pasajero:**
  - Buscar viajes disponibles con filtros
  - Aplicar a múltiples asientos
  - Ver estado de solicitudes (espera, aceptado, cancelado)
  - Cancelar participación en viajes

### Notificaciones
- Sistema de notificaciones en tiempo real
- Notificaciones para:
  - Solicitudes de viaje recibidas
  - Aceptación de solicitud
  - Cancelación de viajes
  - Cancelación de participación

### Integración WhatsApp
- Botón "Contactar" para comunicarse con pasajeros/conductor
- Abre WhatsApp Web con número y mensaje prellenado

## Contacto

**Esteban Sequeda Henao**  
- Código: 0000328378  
- Email: estebansehe@unisabana.edu.co

**Sofy Alejandra Prada Murillo**  
- Código: 0000336152  
- Email: sofyprmu@unisabana.edu.co

---

# Reglas

- Recuerde subir su código antes del 17 de noviembre de 2025, 11:59PM

- No se adminten entregas tardías

- Si la entrega final no está desplegada, no se califica

- Si hay modificaciones luego de la fecha establecida, no se calificará la parte técnica

---

**Universidad de La Sabana** - Proyecto académico
