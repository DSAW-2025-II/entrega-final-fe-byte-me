# 🔧 Configurar Variables de Entorno en Vercel

## ⚠️ Problema
El error "Firebase no está inicializado" aparece porque **no hay variables de entorno configuradas en Vercel**.

## ✅ Solución: Agregar Variables de Entorno

### Paso 1: Ir a Vercel Dashboard

1. Ve a: https://vercel.com/
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **`front`** (o el nombre de tu proyecto frontend)

### Paso 2: Ir a Settings → Environment Variables

1. En el dashboard del proyecto, haz clic en **Settings** (Configuración)
2. En el menú lateral, haz clic en **Environment Variables** (Variables de Entorno)

### Paso 3: Agregar Variables de Firebase

Agrega **TODAS** estas variables de entorno. Haz clic en **"Add New"** para cada una:

#### Variables Requeridas de Firebase:

1. **`NEXT_PUBLIC_FIREBASE_API_KEY`**
   - Valor: Tu Firebase Web API Key
   - Dónde obtenerlo: Firebase Console → Project Settings → General → Web API Key

2. **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`**
   - Valor: `movetogether-e31d4.firebaseapp.com`
   - O el dominio de autenticación de tu proyecto Firebase

3. **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**
   - Valor: `movetogether-e31d4`
   - O el ID de tu proyecto Firebase

4. **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`**
   - Valor: `movetogether-e31d4.firebasestorage.app`
   - O el bucket de Storage de tu proyecto

5. **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`**
   - Valor: Tu Sender ID de Firebase
   - Dónde obtenerlo: Firebase Console → Project Settings → General → Cloud Messaging → Sender ID

6. **`NEXT_PUBLIC_FIREBASE_APP_ID`**
   - Valor: Tu App ID de Firebase
   - Dónde obtenerlo: Firebase Console → Project Settings → General → Your apps → App ID

7. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** (Opcional, pero recomendado)
   - Valor: Tu Google Maps API Key
   - Dónde obtenerlo: Google Cloud Console → APIs & Services → Credentials

8. **`NEXT_PUBLIC_API_URL`** (Opcional, para desarrollo local)
   - Valor: URL de tu backend en Vercel
   - Ejemplo: `https://back-xxxxx.vercel.app`

### Paso 4: Configurar para Producción

Para cada variable:
1. **Environment**: Selecciona **Production**, **Preview**, y **Development** (o al menos **Production**)
2. Haz clic en **Save**

### Paso 5: Obtener los Valores desde Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **`movetogether-e31d4`**
3. Haz clic en el ícono de ⚙️ (Settings) → **Project settings**
4. Ve a la pestaña **General**
5. En la sección **Your apps**, busca tu app web (o crea una si no existe)
6. Verás un objeto de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "movetogether-e31d4.firebaseapp.com",
  projectId: "movetogether-e31d4",
  storageBucket: "movetogether-e31d4.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Mapeo de valores:**
- `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
- `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### Paso 6: Redesplegar

Después de agregar todas las variables:

1. Ve a la pestaña **Deployments** en Vercel
2. Haz clic en los 3 puntos (⋮) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo commit y push (Vercel desplegará automáticamente)

### Paso 7: Verificar

1. Espera a que el deployment termine
2. Visita tu URL de producción
3. Intenta hacer login
4. El error "Firebase no está inicializado" debería desaparecer

## 📋 Checklist de Variables

Asegúrate de tener estas 6 variables mínimas:

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

## ⚠️ Importante

- Todas las variables deben empezar con `NEXT_PUBLIC_` para que estén disponibles en el cliente
- No incluyas comillas en los valores (Vercel las agrega automáticamente)
- Asegúrate de seleccionar **Production** en el selector de Environment

## 🆘 Si aún no funciona

1. Verifica que todas las variables estén en **Production**
2. Redesplega el proyecto después de agregar las variables
3. Espera 1-2 minutos después del deployment
4. Limpia la caché del navegador (Ctrl+Shift+Delete)
5. Verifica en la consola del navegador si hay errores específicos



