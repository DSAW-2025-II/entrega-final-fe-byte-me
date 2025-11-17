# 🔧 Solución: Dominio OAuth no autorizado en Firebase

## Problema
El error indica que el dominio de Vercel no está autorizado para operaciones OAuth (Google Sign-In).

## Solución

### Paso 1: Ir a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: `movetogether-e31d4`
3. Ve a **Authentication** (Autenticación)
4. Haz clic en **Settings** (Configuración) → **Authorized domains** (Dominios autorizados)

### Paso 2: Agregar dominios de Vercel
Agrega estos dominios a la lista:

1. **Dominio específico actual (del error):**
   ```
   move-together2-front-p02ov3m8n-movetogethers-projects.vercel.app
   ```

2. **Patrón wildcard para TODOS los deployments de Vercel (RECOMENDADO):**
   ```
   *.vercel.app
   ```
   ⚠️ **IMPORTANTE:** Agregar `*.vercel.app` es la mejor solución porque cubre todos los deployments automáticos de Vercel, incluyendo los previews y producción.

3. **Dominios de producción específicos (opcional):**
   ```
   front-lt2kk2tme-movetogethers-projects.vercel.app
   front-fgl53bzpe-movetogethers-projects.vercel.app
   ```

4. **Dominio personalizado (si tienes uno configurado):**
   ```
   tu-dominio.com
   ```

### Paso 3: Verificar
- Los dominios deberían aparecer en la lista
- Deberían estar marcados como "Authorized" (Autorizado)

### Paso 4: Probar
1. Recarga la página de login en Vercel
2. Intenta hacer login con Google
3. El error debería desaparecer

## Nota
Cada vez que Vercel crea un nuevo deployment, puede generar un nuevo dominio. Por eso es recomendable agregar `*.vercel.app` para cubrir todos los deployments automáticamente.

