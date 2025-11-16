# 🔧 Solución: Error 403 - API_KEY_HTTP_REFERRER_BLOCKED

## ❌ Error Detectado

```
API_KEY_HTTP_REFERRER_BLOCKED
Requests from referer https://movetogether-e31d4.firebaseapp.com/ are blocked.
```

**Problema:** Tu API Key de Google Maps está bloqueando el dominio de Firebase Hosting.

## ✅ Solución Inmediata

### 1. Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en tu API Key: `AIzaSyBSWvsVganHB141TmEsHXxa2raFm31PBz8`

### 2. Configurar HTTP Referrers

En **"Application restrictions"** → **"HTTP referrers (web sites)"**

Agrega TODOS estos dominios (uno por línea):

```
http://localhost:3000/*
http://localhost:3001/*
http://127.0.0.1:3000/*
http://127.0.0.1:3001/*
https://movetogether-e31d4.firebaseapp.com/*
https://*.firebaseapp.com/*
https://*.web.app/*
https://*.vercel.app/*
```

**Explicación:**
- `localhost` → Desarrollo local
- `movetogether-e31d4.firebaseapp.com` → Tu dominio de Firebase (el que está bloqueado)
- `*.firebaseapp.com` → Cualquier subdominio de Firebase
- `*.web.app` → Dominios alternativos de Firebase
- `*.vercel.app` → Si usas Vercel

### 3. Configurar API Restrictions

En **"API restrictions"**:
- Selecciona: **"Restrict key"**
- Marca SOLO estas 3:
  - ✅ Maps JavaScript API
  - ✅ Places API
  - ✅ Geocoding API

### 4. Guardar y Esperar

1. Click en **"SAVE"**
2. **Espera 2-3 minutos** (los cambios pueden tardar en propagarse)
3. Recarga tu aplicación

## 🔍 Verificar Dominio Exacto

Si no estás seguro del dominio exacto:

1. Abre tu aplicación en el navegador
2. Mira la barra de direcciones → El dominio completo
3. Agrega ese dominio exacto a los HTTP referrers

## ⚠️ Solución Temporal (Solo para Probar)

Si necesitas probar rápidamente:

1. **Application restrictions** → Selecciona **"None"**
2. Guardar y esperar 1-2 minutos
3. Recargar

⚠️ **IMPORTANTE**: Vuelve a configurar las restricciones después de probar.

## 📋 Checklist

- [ ] Agregado `https://movetogether-e31d4.firebaseapp.com/*` a HTTP referrers
- [ ] Agregado `http://localhost:3000/*` para desarrollo
- [ ] Agregado `https://*.vercel.app/*` si usas Vercel
- [ ] APIs correctas habilitadas (Maps, Places, Geocoding)
- [ ] Guardado los cambios
- [ ] Esperado 2-3 minutos
- [ ] Recargado la aplicación

## 🧪 Test

Después de configurar, recarga la página y verifica:
- ✅ El mapa carga correctamente
- ✅ El autocompletado funciona
- ✅ No hay errores 403 en la consola



