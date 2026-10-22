# Protección del directorio público

`GET /servers` es público por diseño. Solo devuelve fichas publicadas. CORS no se usa como sustituto de autenticación. Las rutas administrativas siguen autenticadas y fuera de caché.

## Despliegue

Incluir `bindings` de `public-protection.json` en los metadatos de despliegue del Worker. Conservar los bindings de secretos y D1. No eliminar PUBLIC_RATE_LIMITER en futuros despliegues: con PUBLIC_PROTECTION_REQUIRED=true el endpoint devuelve 503 si falta.

## Comportamiento

- Límite Cloudflare de 15 solicitudes/10 segundos por IP y ubicación, antes de mirar caché; 429 con Retry-After:10. Es aproximado y eventualmente consistente, no un contador global exacto. IP obtenida de CF-Connecting-IP en el borde de Cloudflare, no X-Forwarded-For.
- Cache API almacena exclusivamente JSON público durante 30 segundos por ubicación. Clave canónica independiente de query y Origin. CORS se añade por petición, nunca al objeto compartido.
- Cabecera X-NetLore-Cache: HIT evita D1; MISS consulta y almacena; BYPASS indica caché no disponible. Cache-Control:no-store de la respuesta externa evita prolongar datos antiguos en el navegador; no significa que la caché interna esté desactivada.
- Las ediciones, publicaciones y eliminaciones pueden tardar hasta 30 s en reflejarse en otras consultas públicas. No se promete invalidación global inmediata.
- La caché no garantiza agrupar fallos simultáneos de caché. Un ataque distribuido puede seguir consumiendo invocaciones del Worker; esto no sustituye controles DDoS de plataforma ni monitorización de cuotas.

## Evidencia 22/10/2026

50 tests pasan; tests específicos verifican reducción de lecturas D1, TTL, aislamiento CORS, parámetros aleatorios, límite antes de HIT y fallo seguro sin binding. Despliegue preservó fichas y sesiones. Producción devolvió HIT y 429/Retry-After:10. La primera ráfaga de 20 pasó; prueba espaciada bloqueó en 17, consistente con el carácter aproximado del servicio.

Fuentes: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ y https://developers.cloudflare.com/workers/runtime-apis/cache/
