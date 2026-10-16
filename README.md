# NetLore

Portal de servidores Cyberpunk de Open2077, impulsado por la comunidad KiroshiRP.

Interfaz adaptable a móvil y escritorio, con inglés predeterminado y opción de español y francés, y navegación mediante rutas limpias.

## Desarrollo

Requiere Node.js 22.12 o superior.

```sh
npm ci
npm run dev
```

## Producción

```sh
npm run build
npm run preview
```

La versión para publicar se genera en `dist/`.

GitHub Pages se actualiza automáticamente al publicar cambios en `main`.

El panel `/admin/` permite gestionar fichas gratuitas y promocionadas. La API y los datos se alojan en Cloudflare Workers y D1; su despliegue es independiente del sitio estático. Las credenciales deben mantenerse como secretos del servidor y nunca como variables `VITE_*`.

Las fichas admiten presentación, características, idioma y requisitos opcionales. En una instalación existente, aplica las migraciones pendientes de `worker/migrations/` antes de actualizar la API.

Construido con React y Vite.
