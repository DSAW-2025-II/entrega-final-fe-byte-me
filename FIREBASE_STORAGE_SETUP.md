# Configuración de Firebase Storage

## Bucket de Storage

El bucket de Firebase Storage es:
```
movetogether-e31d4.firebasestorage.app
```

## Variable de Entorno

Agrega esta variable en tu archivo `.env.local` del frontend:

```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=movetogether-e31d4.firebasestorage.app
```

## Reglas de Storage - IMPORTANTE

**PROBLEMA ACTUAL:** Las reglas tienen `allow read, write: if false;` lo que bloquea TODO.

**SOLUCIÓN:** Actualiza las reglas en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `movetogether-e31d4`
3. Ve a **Storage** > **Rules**
4. **BORRA TODO** y reemplaza con estas reglas:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Reglas para fotos de perfil de usuario
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reglas para fotos de vehículos
    match /vehicles/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Reglas para fotos de SOAT
    match /soat/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Permitir acceso a otros archivos si el usuario está autenticado
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

5. Haz clic en **"Publicar"** (Publish) para guardar las reglas.

**VERIFICACIÓN:**
- Las reglas deben permitir que usuarios autenticados (`request.auth != null`) 
- Solo pueden escribir en su propia carpeta (`request.auth.uid == userId`)
- La lectura de fotos de perfil es pública para que se puedan mostrar

## Verificación

Después de configurar las reglas:
1. Recarga la página del frontend
2. Intenta crear un usuario con foto
3. La foto debería subirse correctamente a `users/{uid}/profile.jpg`

