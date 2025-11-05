# 🔧 Solución: "The requested action is invalid" en Google Maps

Este error generalmente ocurre por problemas con las restricciones de la API Key o APIs no habilitadas.

## ✅ Solución Paso a Paso

### 1. Verificar que las APIs estén habilitadas

Ve a Google Cloud Console: https://console.cloud.google.com/

1. **APIs & Services** > **Library**
2. Verifica que estas 3 APIs estén **ENABLED** (habilitadas):
   - ✅ Maps JavaScript API
   - ✅ Places API  
   - ✅ Geocoding API

Si alguna NO está habilitada, haz click en ella y presiona **"ENABLE"**.

### 2. Verificar las restricciones de la API Key

1. Ve a **APIs & Services** > **Credentials**
2. Click en tu API Key
3. Verifica:

   **Application restrictions:**
   - Si está en "HTTP referrers", asegúrate de que incluya:
     ```
     http://localhost:3000/*
     http://localhost:3001/*
     https://*.vercel.app/*
     ```
   - O temporalmente cambia a **"None"** para probar

   **API restrictions:**
   - Debe estar en **"Restrict key"**
   - Y marcar SOLO estas 3:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
   - O temporalmente cambia a **"Don't restrict key"** para probar

4. Click en **"SAVE"**

### 3. Verificar en la consola del navegador

1. Abre tu aplicación: http://localhost:3000
2. Presiona **F12** para abrir la consola
3. Ve a la pestaña **Console**
4. Busca errores que mencionen:
   - "API key not valid"
   - "refererNotAllowedMapError"
   - "This API key is not authorized"

### 4. Verificar que la API Key esté cargando

1. En la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página
4. Busca requests a `maps.googleapis.com`
5. Si ves errores 403 o 400, el problema es la API Key

### 5. Solución temporal (para desarrollo)

Si necesitas probar rápidamente, puedes:

1. Ir a tu API Key en Google Cloud Console
2. En **Application restrictions**: Cambiar a **"None"**
3. En **API restrictions**: Cambiar a **"Don't restrict key"**
4. Guardar
5. Esperar 1-2 minutos
6. Recargar tu aplicación

⚠️ **IMPORTANTE**: Esto es solo para desarrollo. Para producción, vuelve a configurar las restricciones.

### 6. Verificar facturación

Google Maps requiere una cuenta de facturación activa (aunque el tier gratuito es generoso):

1. Ve a **Billing** en Google Cloud Console
2. Verifica que tengas una cuenta de facturación vinculada
3. Si no, crea una (no te cobrará hasta que uses más del crédito gratuito)

## 🧪 Test rápido

Abre esta URL en tu navegador (reemplaza TU_API_KEY):
```
https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&callback=initMap
```

Si ves JavaScript, la API Key funciona. Si ves un error, el problema está en la configuración.

## 📞 Errores comunes

### "refererNotAllowedMapError"
- **Solución**: Agrega `http://localhost:3000/*` a HTTP referrers

### "This API key is not authorized"
- **Solución**: Habilita Maps JavaScript API en la consola

### "Geocoding API is not enabled"
- **Solución**: Habilita Geocoding API en la consola

### "Billing account required"
- **Solución**: Vincula una cuenta de facturación en Google Cloud

