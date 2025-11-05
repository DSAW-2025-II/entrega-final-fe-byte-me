# 🗺️ Guía Paso a Paso: Configurar Google Maps en Google Cloud Console

## 📋 Paso 1: Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Si no tienes un proyecto, crea uno nuevo:
   - Click en el selector de proyectos (arriba)
   - Click en "NUEVO PROYECTO"
   - Nombre: `MoveTogether` (o el que prefieras)
   - Click en "CREAR"

## 🔑 Paso 2: Crear la API Key

1. En el menú lateral izquierdo, ve a:
   **APIs & Services** > **Credentials** (Credenciales)

2. Click en el botón **"+ CREATE CREDENTIALS"** (arriba)
3. Selecciona **"API key"**
4. Se generará una API Key automáticamente
5. **NO cierres la ventana todavía** - primero necesitas habilitar las APIs

## 🚀 Paso 3: Habilitar las APIs Necesarias

**IMPORTANTE:** Debes habilitar estas 3 APIs:

### API 1: Maps JavaScript API
1. En el menú lateral, ve a: **APIs & Services** > **Library** (Biblioteca)
2. Busca: `Maps JavaScript API`
3. Click en el resultado
4. Click en el botón **"ENABLE"** (HABILITAR)

### API 2: Places API
1. Vuelve a **APIs & Services** > **Library**
2. Busca: `Places API`
3. Click en el resultado
4. Click en **"ENABLE"**

### API 3: Geocoding API
1. Vuelve a **APIs & Services** > **Library**
2. Busca: `Geocoding API`
3. Click en el resultado
4. Click en **"ENABLE"**

## ⚙️ Paso 4: Configurar Restricciones de la API Key (Opcional pero Recomendado)

1. Vuelve a **APIs & Services** > **Credentials**
2. Click en la API Key que creaste
3. En **"Application restrictions"**, selecciona:
   - **HTTP referrers (web sites)**
   - Click en **"ADD AN ITEM"**
   - Agrega estas URLs (una por línea):
     ```
     http://localhost:3000/*
     http://localhost:3001/*
     https://*.vercel.app/*
     ```
     (Si ya tienes tu dominio de Vercel, agrégalo también)

4. En **"API restrictions"**, selecciona:
   - **Restrict key**
   - Marca SOLO estas 3 APIs:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API

5. Click en **"SAVE"** (GUARDAR)

## 📝 Paso 5: Copiar la API Key

1. En la página de la API Key, verás algo como:
   ```
   AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
2. **Copia esta clave completa**

## 🔧 Paso 6: Configurar en tu Proyecto

### Para Desarrollo Local:

1. Abre el archivo: `front/.env.local`
2. Si no existe, créalo en la carpeta `front/`
3. Agrega esta línea:
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   (Reemplaza con tu API Key real)

4. Guarda el archivo
5. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Para Vercel (Producción):

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** > **Environment Variables**
3. Click en **"Add New"**
4. Agrega:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Tu API Key (la que copiaste)
   - **Environment**: Selecciona todas (Production, Preview, Development)
5. Click en **"Save"**
6. Vuelve a desplegar tu proyecto para que tome los cambios

## ✅ Paso 7: Verificar que Funciona

1. Abre tu aplicación en el navegador
2. Ve a la página de landing (`/pages/login/landing`)
3. Deberías ver:
   - ✅ Input de búsqueda con autocompletado funcionando
   - ✅ Mapa de Google Maps cargando
   - ✅ Puedes hacer click en el mapa para seleccionar puntos

## 💰 Costos

Google Maps ofrece **$200 USD de crédito mensual gratis**:
- Esto es suficiente para ~28,000 cargas de mapas al mes
- Para la mayoría de proyectos, esto es más que suficiente
- Consulta: https://mapsplatform.google.com/pricing/

## ❌ Problemas Comunes

### "Este sitio no puede cargar Google Maps correctamente"
- Verifica que las 3 APIs estén habilitadas
- Verifica que la API Key esté correcta
- Verifica que las restricciones de HTTP referrers incluyan tu dominio

### "Autocompletado no funciona"
- Verifica que Places API esté habilitada
- Verifica que la API Key tenga permisos para Places API

### "El mapa no carga"
- Verifica que Maps JavaScript API esté habilitada
- Abre la consola del navegador (F12) para ver errores específicos

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para errores
2. Verifica que todas las APIs estén habilitadas
3. Verifica que la API Key esté correctamente configurada en `.env.local`

