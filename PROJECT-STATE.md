# Estado breve — 20/11/2026

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

## Rediseño 20/11 (sin publicar, sin commit)
- Interfaz nueva: lanzador con pestañas (Servidores/Promoción/Información/Pase) sobre Night City en dorado; en Inicio el hero queda a la izquierda y la ventana a la derecha. Subpestañas Todos/Promocionados/Gratuitos (`?lista=`), filas de servidor y fila punteada «Aparece aquí». Archivos: `Launcher.jsx`, `launcher.css`, `tokens.css`, `base.css`, `directory.css`, `styles.css`.
- Retirado por decisión del propietario: mapa interactivo (arrastre, zoom, rueda), `map-wheel.mjs` y su prueba. Texto de promoción: «borde dorado». Tipografía Albert Sans autoalojada (@fontsource-variable, compatible con CSP).
- Verificado en local: 46 pruebas y build; capturas Chromium a 1280, 820 y 390 px con fichas simuladas en el navegador (no tocan datos reales). Sloplint estático 0 FAIL; falta la capa de render (sin puppeteer-core).
- Sin comprobar: admin con el tema nuevo (solo recoloreado automáticamente), navegador real y móviles reales, contraste medido. Nada desplegado: GitHub Pages depende de main y Cloudflare Pages es manual.

## Cierre del rediseño 20/11 (rama claude/modest-archimedes-3usxwo)
- Hecho y verificado en local: logo, fondos y og:image dorados propios (`netlore-logo-gold`, `netlore-city-gold-*`, `netlore-share.png`, 1200x630; la prueba de metadatos se actualizó al nuevo nombre); admin rehecho en CSS plano con tokens; esqueletos de carga; fila «Aparece aquí» fija al pie en Inicio; atajo `/` y Ctrl/Cmd+K para buscar; paginación sin guiones ni flechas de texto; objetivos táctiles de 44 px en táctil.
- Contraste medido (OKLCH a sRGB): todos los pares de texto de la interfaz ≥ 4,5:1 tras subir `--color-muted` a L 78 %. Emulación Playwright de iPhone SE/13, Pixel 7, Galaxy S9+ e iPad Mini en es/fr: sin desbordamiento horizontal en las 5 rutas. Son emulaciones, no dispositivos reales.
- Sin comprobar: admin con datos reales (solo con API simulada), render del linter (sin puppeteer-core), producción tras el despliegue.
- Pendiente y bloqueado por decisiones o credenciales: imagen por ficha (campo D1 + almacenamiento), pestaña «Próximamente» (fechas reales), estado del servidor (fuente real), paginación y búsqueda en SQL, copias de D1 y registro del admin. Todo cambio de Worker/D1 lo despliega el propietario con sus credenciales.

## Despliegue y base técnica 20/11
- Desplegado en main (50fafd6): GitHub Pages y Cloudflare Pages terminaron con éxito en Actions. No pude comprobar las URLs en vivo (el proxy de este entorno las bloquea): revisar visualmente netlore.pages.dev y la CSP.
- Lighthouse local (preview, API sin red): móvil rendimiento 99, accesibilidad 100, buenas prácticas 96 (el error de consola es la API bloqueada en el entorno), SEO 100.
- En rama, aún sin desplegar: robots.txt, precarga del fondo, pestaña «Preguntas». Worker: paginación SQL opcional y registro de auditoría con migración 0004, con pruebas (49 en total). Ver worker/OPERATIONS.md. La interfaz no usa la paginación SQL todavía.
- `npm run test:visual` (Playwright, requiere build y navegador): 15 páginas, sin desbordes, un h1, sin imágenes rotas.
- «Próximamente», imagen por ficha y estado del servidor: aplazados por decisión del propietario o falta de fuente real.
- 20/11 (main): panel «Actividad reciente» en el admin; muestra aviso si la API aún no tiene /admin/audit. Comprobado solo con API simulada. Worker y migración 0004 siguen sin desplegar.
