# 🔧 Habilitar Directions API en Google Cloud Console

## Problema
El error indica que la Directions Service API (legacy) no está habilitada para tu proyecto.

## Solución: Habilitar Directions API

### Paso 1: Ir a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto: `movetogether-e31d4` (o el proyecto que corresponda)

### Paso 2: Habilitar Directions API
1. Ve a **APIs & Services** → **Library** (Biblioteca)
2. Busca "Directions API" en la barra de búsqueda
3. Haz clic en "Directions API"
4. Haz clic en el botón **"ENABLE"** (Habilitar)

### Paso 3: Verificar
- Deberías ver "API enabled" (API habilitada) en verde
- Espera unos segundos para que se propague

### Paso 4: Verificar restricciones de API Key
1. Ve a **APIs & Services** → **Credentials**
2. Busca tu API Key de Google Maps: `AIzaSyBSWvsVganHB141TmEsHXxa2raFm31PBz8`
3. Haz clic en la API Key
4. En **API restrictions**, verifica que "Directions API" esté en la lista de APIs permitidas
5. Si no está, agrega "Directions API" a las restricciones

### Paso 5: Probar
1. Recarga la página
2. Selecciona origen y destino
3. La ruta debería calcularse correctamente

## Nota
Google recomienda migrar a la nueva Routes API, pero la Directions API (legacy) sigue funcionando si está habilitada.



