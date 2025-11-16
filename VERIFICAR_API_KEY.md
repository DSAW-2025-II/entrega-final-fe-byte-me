# 🔍 Verificación de API Key de Google Maps

## ✅ APIs Habilitadas (Correcto)
- ✅ Maps JavaScript API
- ✅ Geocoding API  
- ✅ Places API

## 🔧 Problema: Restricciones de API Key

El error "The requested action is invalid" generalmente ocurre por **restricciones de la API Key**.

### Solución Inmediata:

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en tu API Key: `AIzaSyBSWvsVganHB141TmEsHXxa2raFm31PBz8`
3. En **"Application restrictions"**:
   - **Opción A (Recomendada para desarrollo):**
     - Selecciona: **"HTTP referrers (web sites)"**
     - Agrega estos referrers (uno por línea):
       ```
       http://localhost:3000/*
       http://localhost:3001/*
       http://127.0.0.1:3000/*
       http://127.0.0.1:3001/*
       ```
   
   - **Opción B (Temporal para probar):**
     - Selecciona: **"None"** (sin restricciones)
     - ⚠️ Solo para desarrollo local

4. En **"API restrictions"**:
   - **Opción A (Recomendada):**
     - Selecciona: **"Restrict key"**
     - Marca SOLO estas 3:
       - ✅ Maps JavaScript API
       - ✅ Places API
       - ✅ Geocoding API
   
   - **Opción B (Temporal para probar):**
     - Selecciona: **"Don't restrict key"**
     - ⚠️ Solo para desarrollo local

5. Click en **"SAVE"** (Guardar)

6. **Espera 1-2 minutos** para que los cambios se propaguen

7. **Limpia la caché del navegador:**
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) o Cmd+Shift+Delete (Mac)
   - Selecciona "Cached images and files"
   - Click en "Clear data"

8. **Recarga la página** (Ctrl+F5 o Cmd+Shift+R para forzar recarga)

## 🧪 Test de la API Key

Abre esta URL en tu navegador para verificar:
```
https://maps.googleapis.com/maps/api/js?key=AIzaSyBSWvsVganHB141TmEsHXxa2raFm31PBz8&libraries=places,geocoding
```

**Resultado esperado:**
- Si ves código JavaScript → ✅ API Key funciona
- Si ves un error JSON → ❌ Problema con restricciones o APIs

## 📋 Checklist Final

- [ ] Las 3 APIs están habilitadas ✅ (Ya lo tienes)
- [ ] API Key tiene restricciones configuradas correctamente
- [ ] HTTP referrers incluye `http://localhost:3000/*`
- [ ] API restrictions incluye las 3 APIs necesarias
- [ ] Esperaste 1-2 minutos después de guardar
- [ ] Limpiaste la caché del navegador
- [ ] Recargaste la página con Ctrl+F5

## 🔍 Verificar en Consola del Navegador

1. Abre tu app: http://localhost:3000/pages/login/landing
2. Presiona **F12** → Pestaña **Console**
3. Busca errores que mencionen:
   - "refererNotAllowedMapError" → Restricciones de referrer
   - "This API key is not authorized" → API no habilitada
   - "Geocoding API is not enabled" → API no habilitada

## 💡 Solución Temporal (Solo Desarrollo)

Si necesitas probar rápidamente sin restricciones:

1. API Key settings → Application restrictions → **"None"**
2. API Key settings → API restrictions → **"Don't restrict key"**
3. Guardar y esperar 1-2 minutos
4. Recargar la app

⚠️ **IMPORTANTE**: Vuelve a configurar restricciones antes de producción.



