# Estado breve — 11/11/2026

## Arquitectura
- React/Vite; frontend publicado en https://kiroshirp.github.io/NetLore/ mediante main/GitHub Actions.
- API https://netlore-api.kiroshirp.workers.dev; Cloudflare Worker + D1. Credenciales solo en secretos/local ignorado.
- Frontend adicional en https://netlore.pages.dev/ mediante subida directa de dist; GitHub Pages mantiene su pipeline independiente. Ver CLOUDFLARE-HOSTING.md.

## Decisiones y estado previo comprobado
- Biblioteca de recursos Open77: exclusivamente para el propietario en /admin/recursos/, con fichas en D1 separadas del directorio público. «Listo» es interno. Sin cuentas de compradores, pagos ni publicación. Migración 0003 aplicada; API desplegada y comprobada (401 sin sesión, 200 con sesión). Alta/edición comprobadas en SQLite local, sin crear recursos en producción.
- Admin: lista de 15 fichas, editor separado, validación, aviso de cambios pendientes, borrador retenido ante expiración mientras componente abierto.
- Directorio: 12 fichas por página, filtros en URL. La API aún devuelve todas las fichas; falta paginación SQL.
- 48 pruebas pasaban antes de la corrección de caché/límite. No dar por verificada la UI admin con catálogo poblado.
- 22/10: API desplegada con caché compartida por ubicación de 30 s y PUBLIC_RATE_LIMITER (15/10 s por IP, aproximado). Configuración en worker/public-protection.json. Producción: HIT incluso con query variable; prueba espaciada obtuvo 429 y Retry-After:10 en solicitud 17. Ráfaga inicial de 20 pasó: no prometer umbral exacto ni protección DDoS total. 50 pruebas pasan; fichas y sesiones preservadas.
- Cache-Control exterior permanece no-store deliberadamente: la caché interna usa 30 s. Cambios administrativos pueden tardar hasta 30 s en reflejarse en cada ubicación. No hay invalidación global inmediata.

## Pendientes reales
- CSP y anti-enmarcado verificados en Cloudflare Pages. _headers no se aplica en GitHub Pages.
- Backups/restauración, trazabilidad administrativa y caducidad de promociones no auditados/cerrados.
- Revisión visual autenticada con datos de prueba, dispositivos reales y paginación del backend.
- La auditoría extensa está en AUDITORIA-NETLORE-2026-10-19.md (local); no sustituir este resumen por el historial.

11/11: catálogo con categorías, contadores y ficha de detalle. 51 pruebas y build correctos. Ruta directa, CSP, CORS, 401 anónimo y 200 autenticado con no-store verificados en Cloudflare.

## Publicación
- Git CLI usa una identidad sin permisos de push; conexión GitHub del chat permitió publicaciones anteriores. Verificar cabeza remota y usar actualización condicionada a SHA.
- Worker: helper local .local/cloudflare.mjs accede a credenciales sin imprimirlas. Mantener configuración de rate limiting en todo despliegue futuro.
