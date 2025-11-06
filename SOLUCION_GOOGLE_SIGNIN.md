# 🔧 Solución: Google Sign-In no abre la ventana de autenticación

## ⚠️ Problema
El botón "Continuar con Google" no abre la ventana popup de Google para autenticarse.

**Error en consola:**
```
The current domain is not authorized for OAuth operations. 
This will prevent signInWithPopup from working.
```

## ✅ Solución Rápida

### Paso 1: Ir a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **`movetogether-e31d4`**
3. En el menú lateral, haz clic en **Authentication** (Autenticación)
4. Haz clic en la pestaña **Settings** (Configuración)
5. Haz clic en **Authorized domains** (Dominios autorizados)

### Paso 2: Agregar el dominio de Vercel

Verás una lista de dominios autorizados. Haz clic en el botón **"Add domain"** (Agregar dominio) y agrega:

```
*.vercel.app
```

**¿Por qué `*.vercel.app`?**
- Vercel crea un dominio único para cada deployment
- El wildcard `*` cubre TODOS los deployments automáticamente
- No necesitas agregar cada dominio individualmente

### Paso 3: Verificar

Después de agregar el dominio:
1. Debería aparecer en la lista como "Authorized" (Autorizado)
2. Espera 1-2 minutos para que los cambios se propaguen
3. Recarga la página de login en Vercel
4. Intenta hacer login con Google nuevamente

### Paso 4: Probar

1. Recarga la página de login
2. Haz clic en "Continuar con Google"
3. Debería abrirse la ventana popup de Google
4. Selecciona tu cuenta de Google
5. Autoriza la aplicación
6. Deberías ser redirigido correctamente

## 📋 Lista de dominios autorizados actual

Después de agregar `*.vercel.app`, deberías ver algo como:

```
✅ localhost
✅ 127.0.0.1
✅ movetogether-e31d4.firebaseapp.com
✅ movetogether-e31d4.web.app
✅ *.vercel.app  ← Este es el que necesitas agregar
```

## 🚨 Si aún no funciona

1. **Limpia la caché del navegador:**
   - Ctrl+Shift+Delete (Windows/Linux) o Cmd+Shift+Delete (Mac)
   - Selecciona "Cached images and files"
   - Haz clic en "Clear data"

2. **Verifica que el dominio esté correctamente escrito:**
   - Debe ser exactamente: `*.vercel.app` (con el asterisco al inicio)
   - No debe tener espacios
   - No debe tener protocolo (http:// o https://)

3. **Espera 2-3 minutos:**
   - Los cambios en Firebase pueden tardar en propagarse

4. **Verifica en la consola del navegador:**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - El error sobre "domain not authorized" debería desaparecer

## 📝 Nota adicional

Cada vez que Vercel hace un nuevo deployment, puede generar un nuevo dominio. Por eso es importante usar `*.vercel.app` en lugar de agregar dominios individuales uno por uno.

