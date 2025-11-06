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

1. **Dominio específico actual:**
   ```
   move-together2-front-q1ykwa1wp-movetogethers-projects.vercel.app
   ```

2. **Dominio de producción principal:**
   ```
   front-l8ih1ubqb-movetogethers-projects.vercel.app
   ```

3. **Patrón wildcard para todos los deployments:**
   ```
   *.vercel.app
   ```

4. **Dominio personalizado (si tienes uno):**
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

