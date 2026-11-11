# Preparación de alojamiento en Cloudflare

## Publicación actual

El proyecto netlore sirve https://netlore.pages.dev/ por subida directa. GitHub Pages conserva su despliegue independiente. Para actualizar Cloudflare, ejecutar las pruebas y compilar con NETLORE_BASE_PATH=/, NETLORE_SITE_URL=https://netlore.pages.dev/ y VITE_API_BASE_URL=https://netlore-api.kiroshirp.workers.dev. Publicar únicamente dist con Wrangler Pages en la rama main del proyecto netlore.

La API permite ambos orígenes exactos. El catálogo en /admin/recursos/ exige sesión administrativa para consultar o modificar recursos. El 11/11/2026 se verificaron la ruta directa, canonical, CSP, anti-enmarcado, rechazo anónimo y lectura autenticada. Los cambios de GitHub no se publican automáticamente en Cloudflare.
