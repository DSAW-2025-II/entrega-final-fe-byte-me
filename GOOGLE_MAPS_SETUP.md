# Configuración de Google Maps API

## Configuración de la API Key

Para que funcione la integración de Google Maps, necesitas configurar una API Key de Google Maps.

### 1. Obtener la API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **API Key**
5. Copia la API Key generada

### 2. Habilitar las APIs necesarias

En **APIs & Services** > **Library**, habilita las siguientes APIs:
- **Maps JavaScript API**
- **Places API**
- **Geocoding API**

### 3. Configurar restricciones (Recomendado)

En la configuración de tu API Key:
- **Application restrictions**: Restringe por HTTP referrers
- **API restrictions**: Restringe solo a las APIs necesarias (Maps JavaScript API, Places API, Geocoding API)

Para desarrollo local, agrega:
- `http://localhost:3000/*`
- `http://localhost:3001/*`

Para producción, agrega:
- `https://tu-dominio.vercel.app/*`

### 4. Configurar en el proyecto

**Local (.env.local):**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
```

**Vercel (Environment Variables):**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings > Environment Variables
3. Agrega:
   - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Value: Tu API Key
   - Environment: Production, Preview, Development

### 5. Verificar

Después de configurar, recarga la aplicación y deberías ver:
- Autocompletado de lugares funcionando
- Mapa interactivo cargando
- Capacidad de seleccionar puntos en el mapa

## Características implementadas

✅ **Autocompletado de lugares**: Busca lugares reales con Google Places API
✅ **Selección en mapa**: Click en el mapa para seleccionar origen/destino
✅ **Geocoding inverso**: Obtiene la dirección desde coordenadas
✅ **Marcadores visuales**: Muestra origen (azul) y destino (rojo) en el mapa
✅ **Restricción a Colombia**: Las búsquedas están limitadas a Colombia

## Costos

Google Maps tiene un tier gratuito generoso:
- **$200 USD de crédito mensual** (suficiente para ~28,000 cargas de mapas)
- Después del tier gratuito, los costos son muy bajos

Consulta la [página de precios de Google Maps](https://mapsplatform.google.com/pricing/) para más detalles.

