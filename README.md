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

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (ver sección de Configuración).

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

### Despliegue en Vercel

El proyecto está configurado para desplegarse automáticamente en Vercel cuando se hace push a la rama `main`.

Para desplegar manualmente:

```bash
# Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# Desplegar
vercel --prod
```

### Ejemplo de Uso

1. **Iniciar sesión:**
   - Accede a `/pages/login`
   - Inicia sesión con Google o credenciales de la universidad

2. **Crear un viaje:**
   - Ve a `/pages/trips/create`
   - Selecciona origen y destino en el mapa
   - Configura fecha, hora y detalles del viaje
   - Publica el viaje

3. **Buscar viajes:**
   - En la misma página, cambia a modo "Pasajero"
   - Ingresa tu origen y destino
   - Selecciona fecha y hora
   - Aplica a los viajes disponibles

4. **Gestionar viajes:**
   - Ve a `/pages/trips` para ver tus viajes
   - Como conductor: acepta pasajeros, cancela viajes
   - Como pasajero: cancela tu participación

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001
# Para producción: NEXT_PUBLIC_API_URL=https://back-zeta-cyan.vercel.app

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key
```

### Archivo de Configuración Next.js

El proyecto incluye `next.config.ts` para configuración personalizada:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuraciones personalizadas
};

export default nextConfig;
```

## Estructura del Proyecto

```
front/
├── app/                      # App Router de Next.js
│   ├── components/           # Componentes reutilizables
│   │   ├── NotificationButton.tsx
│   │   ├── SidebarMenu.tsx
│   │   └── UserPageLayout.tsx
│   ├── contexts/             # Contextos de React
│   │   ├── ThemeContext.tsx  # Tema claro/oscuro
│   │   └── UserContext.tsx    # Estado del usuario
│   ├── hooks/                # Custom hooks
│   │   ├── useAuthGuard.ts   # Protección de rutas
│   │   └── useThemeStyles.ts # Estilos según tema
│   ├── pages/                # Páginas de la aplicación
│   │   ├── login/            # Autenticación
│   │   ├── trips/            # Gestión de viajes
│   │   │   ├── create/       # Crear/buscar viajes
│   │   │   └── page.tsx      # Mis viajes
│   │   ├── my-car/           # Gestión de vehículos
│   │   ├── user/             # Perfil de usuario
│   │   ├── settings/         # Configuración
│   │   └── help/             # Ayuda y FAQ
│   ├── lib/                  # Utilidades del cliente
│   │   ├── firebase.ts       # Configuración Firebase
│   │   └── loginGoogle.ts    # Login con Google
│   └── globals.css           # Estilos globales
├── components/               # Componentes compartidos
│   ├── MyTrips/              # Componente de mis viajes
│   ├── MapPicker.tsx         # Selector de ubicación en mapa
│   └── PlaceAutocomplete.tsx # Autocompletado de direcciones
├── lib/                      # Librerías y utilidades
│   ├── api.ts                # Cliente HTTP para API
│   ├── auth.ts               # Utilidades de autenticación
│   ├── firebaseClient.ts     # Cliente de Firebase
│   └── googleMaps.ts         # Utilidades de Google Maps
├── public/                   # Archivos estáticos
├── package.json              # Dependencias y scripts
└── tsconfig.json             # Configuración TypeScript
```

### Descripción de Carpetas Principales

- **`app/`**: Contiene todas las páginas y componentes usando el App Router de Next.js 13+.
- **`components/`**: Componentes reutilizables compartidos entre páginas.
- **`lib/`**: Utilidades y helpers (API client, autenticación, Firebase).
- **`public/`**: Archivos estáticos (imágenes, iconos) accesibles públicamente.

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

## Tests

Actualmente no hay tests automatizados implementados. Para agregar tests:

```bash
# Instalar dependencias de testing
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Ejecutar tests (cuando estén implementados)
npm test
```

## Contribución

### Reglas para Contribuir

1. **Ramas:** Crear una rama desde `main` para cada feature o fix
   ```bash
   git checkout -b feature/nombre-del-feature
   ```

2. **Estilo de Código:**
   - Usar TypeScript estricto
   - Seguir las convenciones de React (componentes en PascalCase)
   - Usar componentes funcionales con hooks
   - Estilos inline con objetos (CSS-in-JS) o módulos CSS

3. **Commits:**
   - Mensajes descriptivos en español
   - Formato: `tipo: descripción breve`
   - Ejemplo: `feat: agregar botón de contacto por WhatsApp`

4. **Pull Requests:**
   - Describir claramente los cambios realizados
   - Incluir capturas de pantalla si hay cambios visuales
   - Asegurar que el código compila sin errores (`npm run build`)
   - Verificar que no hay errores de linting (`npm run lint`)

5. **Issues:**
   - Usar etiquetas apropiadas (bug, feature, enhancement)
   - Incluir pasos para reproducir en caso de bugs
   - Especificar navegador y versión si es relevante

## Licencia

Este proyecto es de uso académico. Todos los derechos reservados.

## Contacto / Autoría

### Desarrolladores

**Esteban Sequeda Henao**  
- Código: 0000328378  
- Email: estebansehe@unisabana.edu.co

**Sofy Alejandra Prada Murillo**  
- Código: 0000336152  
- Email: sofyprmu@unisabana.edu.co

### Soporte

- **Frontend desplegado:** [https://front-rouge-two.vercel.app/pages/login/landing](https://front-rouge-two.vercel.app/pages/login/landing)
- **Backend desplegado:** [https://back-zeta-cyan.vercel.app](https://back-zeta-cyan.vercel.app)
- **Issues:** Crear un issue en el repositorio de GitHub para reportar problemas o sugerencias

---

**Universidad de La Sabana** - Proyecto académico

