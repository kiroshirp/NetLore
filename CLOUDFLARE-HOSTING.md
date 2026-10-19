# Preparación de alojamiento en Cloudflare

Estado: configuración preparada, sin proyecto nuevo creado y sin cambio de dirección pública.

NetLore es una aplicación estática Vite. Puede alojarse en Pages con un subdominio gratuito `nombre.pages.dev`. La API y D1 actuales pueden conservarse. El nombre se confirma al crear el proyecto; no está reservado.

## Configuración del proyecto

- Compilación: `npm ci` y `npm run build`.
- Directorio publicado: `dist`.
- Node: 24, como en el pipeline existente.
- `NETLORE_BASE_PATH=/`.
- `NETLORE_SITE_URL=https://SUBDOMINIO-ASIGNADO.pages.dev/`, sustituido por la dirección real.
- No copiar `.env.local`, secretos ni la carpeta `.local` al alojamiento.
- La API usa su endpoint público habitual. Añadir exclusivamente el origen definitivo a `ALLOWED_ORIGINS` del Worker, conservando temporalmente el origen de GitHub durante la transición. No autorizar todos los previews ni usar comodines.

## Seguridad y comprobación

`public/_headers` se copia a `dist` y declara CSP, anti-enmarcado y otras cabeceras para Cloudflare. GitHub Pages no interpreta ese archivo. La CSP permite estilos de React e imágenes data/blob usadas por el pase. Debe verificarse en una URL de Cloudflare antes de considerar cerrado el hallazgo de seguridad: login, guardar, descargar PNG, navegación y consola sin bloqueos de CSP.

Verificar rutas directas y recarga, metadatos/canonical, CORS, cabeceras HTTP y datos existentes. Mantener GitHub Pages disponible hasta confirmar el resultado. Elegir un único dominio canónico y resolver redirecciones del antiguo antes de anunciar la nueva dirección.

## Despliegue continuo

Preferir integración con GitHub al crear Pages si se desea publicar automáticamente con cada cambio. Un proyecto creado con Direct Upload no puede cambiar después a integración Git; sí puede recibir despliegues desde un pipeline propio. No se ha añadido un token de Cloudflare a GitHub ni se han modificado permisos.

## Coste y alcance

El subdominio de plataforma no requiere comprar un dominio propio. El servicio estático puede alojarse en el plan gratuito, sujeto a límites vigentes. Workers y D1 tienen cuotas independientes; no equivale a backend ilimitado. El cambio aporta control de cabeceras y gestión unificada; una mejora de velocidad debe medirse.

Referencias oficiales consultadas el 19/10/2026:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
