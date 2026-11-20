# Operaciones del Worker (pendientes de despliegue por el propietario)

Estos cambios están en el repositorio y probados con SQLite en memoria, pero **no están desplegados**. El Worker y D1 se despliegan aparte del sitio.

## Orden de despliegue

1. Aplicar la migración `migrations/0004_audit_log.sql` a D1.
2. Desplegar el Worker conservando bindings, secretos y `public-protection.json` (ver `PROTECTION.md`).

El registro de auditoría es opcional en tiempo de ejecución: si el Worker se despliega antes que la migración, las altas, ediciones y accesos siguen funcionando y simplemente no se registran.

## Paginación y búsqueda en SQL (aditiva)

`GET /servers` sin parámetros devuelve la lista completa y cacheada de siempre. Con `page`, `pageSize` (máx. 50), `category`, `scope` (`promoted` o `free`) o `q` (máx. 60 caracteres) devuelve `{servers, pagination:{page,pages,pageSize,total}, counts:{promoted,free,all}}`. Esas consultas no usan la caché compartida (evita variantes ilimitadas) y pasan antes por el limitador de Cloudflare.

Limitación conocida: `q` usa LIKE de SQLite, insensible a mayúsculas solo en ASCII y sensible a acentos, mientras que el filtro del navegador ignora acentos. Para igualarlo haría falta una columna de texto normalizado.

**La interfaz todavía no usa estos parámetros.** El directorio sigue cargando todas las fichas y paginando en el navegador, lo que es correcto con pocas fichas (hoy unas 15). Conviene cambiar la interfaz cuando haya del orden de varios cientos, y hacerlo con la API ya desplegada.

## Registro de cambios del admin

La tabla `audit_log` guarda fecha, acción (`login`, `create`, `update`, `delete`), tipo, id y el nombre de la ficha. No guarda contraseñas, tokens ni IP. Se purgan las entradas de más de 180 días en la tarea programada. Lectura: `GET /admin/audit` (autenticado, últimas 100). La interfaz de administración todavía no lo muestra.

## Copias de seguridad

D1 ofrece Time Travel (restauración a un momento concreto) sin configuración; la ventana de retención depende del plan, compruébala en el panel de Cloudflare. Una copia exportada con `wrangler d1 export` serviría como respaldo independiente, pero no está programada ni probada aquí.
