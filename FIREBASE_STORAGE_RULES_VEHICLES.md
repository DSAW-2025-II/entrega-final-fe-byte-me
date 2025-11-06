# Firebase Storage Rules para Vehículos

## Problema
Error: `Firebase Storage: User does not have permission to access 'vehicles/...'` o `storage/unauthorized`

## Solución: Actualizar Reglas de Firebase Storage

Necesitas actualizar las reglas de Firebase Storage en Firebase Console para permitir que los usuarios autenticados suban fotos de vehículos y SOAT.

### Paso 1: Ir a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `movetogether-e31d4`
3. En el menú lateral, haz clic en **Storage**
4. Haz clic en la pestaña **Rules**

### Paso 2: Copiar y Pegar las Reglas

Copia y pega estas reglas en el editor de reglas:

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

### Paso 3: Publicar las Reglas

1. Haz clic en el botón **Publicar** (Publish)
2. Espera a que se confirmen los cambios (puede tomar unos segundos)

### Explicación de las Reglas

- **`/vehicles/{fileName}`**: Permite que cualquier usuario autenticado lea y escriba en la carpeta `vehicles/`
- **`/soat/{fileName}`**: Permite que cualquier usuario autenticado lea y escriba en la carpeta `soat/`
- **`/users/{userId}/{allPaths=**}`**: Permite que los usuarios solo puedan escribir en su propia carpeta de usuario
- **`/{allPaths=**}`**: Regla general para otros archivos (solo lectura y escritura para usuarios autenticados)

### Verificación

Después de publicar las reglas:

1. Intenta subir una foto de vehículo nuevamente
2. Si aún hay errores, espera 1-2 minutos para que las reglas se propaguen
3. Verifica en la consola del navegador que no aparezcan más errores de `storage/unauthorized`

### Nota de Seguridad

Estas reglas permiten que cualquier usuario autenticado pueda subir y leer fotos de vehículos. Si necesitas restricciones más estrictas (por ejemplo, solo el dueño puede ver sus vehículos), puedes ajustar las reglas según tus necesidades.

### Alternativa: Reglas Más Restrictivas (Opcional)

Si quieres que solo el dueño del vehículo pueda ver sus fotos, puedes usar esta versión más restrictiva:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Reglas para fotos de perfil de usuario
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Reglas para fotos de vehículos (acceso público para lectura, autenticado para escritura)
    match /vehicles/{fileName} {
      allow read: if true; // Lectura pública
      allow write: if request.auth != null; // Escritura solo para autenticados
    }
    
    // Reglas para fotos de SOAT (acceso público para lectura, autenticado para escritura)
    match /soat/{fileName} {
      allow read: if true; // Lectura pública
      allow write: if request.auth != null; // Escritura solo para autenticados
    }
  }
}
```

