# 🔧 Solución: REQUEST_DENIED en Directions API

## Problema
Aunque la Directions API está habilitada en el proyecto, recibes el error:
```
"This API key is not authorized to use this service"
REQUEST_DENIED
```

## Solución

### Paso 1: Verificar restricciones de la API Key
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Busca tu API Key: `AIzaSyBSWvsVganHB141TmEsHXxa2raFm31PBz8`
3. Haz clic en la API Key para editarla

### Paso 2: Agregar Directions API a las restricciones
1. En la sección **"API restrictions"** (Restricciones de API):
   - Si está en **"Don't restrict key"** (No restringir):
     - Cambia a **"Restrict key"** (Restringir clave)
     - Marca estas APIs:
       - ✅ Maps JavaScript API
       - ✅ Places API
       - ✅ Geocoding API
       - ✅ **Directions API** ⚠️ **IMPORTANTE: Asegúrate de que esté marcada**
   
   - Si ya está en **"Restrict key"**:
     - Verifica que **Directions API** esté en la lista de APIs permitidas
     - Si NO está, agrega **Directions API** a la lista

### Paso 3: Guardar y esperar
1. Haz clic en **"SAVE"** (Guardar)
2. Espera **2-5 minutos** para que los cambios se propaguen
3. La nota dice: "Es posible que la configuración tarde hasta 5 minutos en aplicarse"

### Paso 4: Probar
1. Recarga completamente la página (Ctrl+F5 o Cmd+Shift+R)
2. Selecciona origen y destino
3. La ruta debería calcularse correctamente

## Verificación adicional

Si después de 5 minutos sigue sin funcionar:

1. Verifica que la API Key que estás usando en el código sea la misma que estás editando
2. Verifica que la API Key esté en la variable de entorno:
   - `.env.local` (local)
   - Vercel Environment Variables (producción)
3. Verifica que Directions API esté realmente habilitada:
   - Ve a: https://console.cloud.google.com/apis/library
   - Busca "Directions API"
   - Debe decir "API enabled" (API habilitada)

## Nota importante
La Directions API debe estar:
- ✅ Habilitada en el proyecto (esto ya lo tienes)
- ✅ Incluida en las restricciones de la API Key (esto es lo que falta)

