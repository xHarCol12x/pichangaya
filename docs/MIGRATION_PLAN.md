# Plan de migracion

Este plan ordena los cambios para mejorar seguridad y estructura sin hacer una reescritura grande. Cada fase debe cerrar con build, pruebas basicas y verificacion manual del flujo afectado.

## Fase 0: Documentacion y linea base

Estado: iniciado.

Objetivo:

- Dejar clara la arquitectura objetivo.
- Registrar los riesgos actuales.
- Definir el orden de implementacion.

Entregables:

- `docs/ARCHITECTURE.md`
- `docs/MIGRATION_PLAN.md`
- README enlazando los documentos.

Verificacion:

- El equipo puede levantar el proyecto y entender que se esta migrando.

## Fase 1: Reservas seguras por tenant

Riesgo actual:

- Una reserva puede conectarse a una cancha que no pertenece al usuario actual.
- El check de solapamiento no es atomico.

Cambios:

- Validar que `field.venue.ownerId` corresponda al usuario/tenant actual al crear y actualizar reservas.
- Validar que `clientId`, si existe, pertenezca al mismo tenant.
- Mover validacion de disponibilidad y escritura a una transaccion.
- Agregar tests para cross-tenant y solapamiento.

Archivos principales:

- `backend/src/bookings/bookings.service.ts`
- `backend/src/bookings/bookings.controller.ts`
- `backend/src/bookings/dto/`
- `backend/prisma/schema.prisma`

Criterio de salida:

- Un usuario no puede crear o mover reservas a canchas ajenas.
- Dos reservas activas no pueden ocupar el mismo horario de la misma cancha.

## Fase 2: Sesiones con refresh token seguro

Riesgo actual:

- La sesion depende de `localStorage`.
- El JWT se usa como credencial de larga vida en el navegador.
- SSE recibe token por querystring.

Cambios:

- Crear modelo `Session`.
- Implementar `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- Guardar refresh token como hash.
- Enviar refresh token en cookie `httpOnly`.
- Reducir vida del access token.
- Mover access token a memoria del frontend.
- Reemplazar token en querystring para SSE por cookie o token efimero.

Archivos principales:

- `backend/prisma/schema.prisma`
- `backend/src/auth/`
- `frontend/src/lib/api.ts`
- `frontend/src/app/dashboard/layout.tsx`
- `frontend/src/components/dashboard/NotificationBell.tsx`

Criterio de salida:

- Login, refresh y logout funcionan.
- Recargar la pagina mantiene sesion por cookie.
- Logout invalida la sesion en backend.
- No hay refresh token en `localStorage`.

## Fase 3: Tenant explicito

Riesgo actual:

- El tenant esta implicito en `User ADMIN`.
- Crecer a equipos o roles por sede sera dificil.

Cambios:

- Agregar modelo `Tenant`.
- Agregar `TenantMembership`.
- Migrar `Venue` hacia `tenantId`.
- Mantener compatibilidad temporal con `ownerId` mientras se migra.
- Agregar `tenantId` al contexto autenticado.
- Crear `TenantGuard` o helper comun para scoping.

Archivos principales:

- `backend/prisma/schema.prisma`
- `backend/src/users/`
- `backend/src/venues/`
- `backend/src/fields/`
- `backend/src/clients/`
- `backend/src/bookings/`

Criterio de salida:

- Todas las consultas operativas pueden filtrarse por `tenantId`.
- Usuarios pueden pertenecer a un tenant.
- El comportamiento actual sigue funcionando para admins existentes.

## Fase 4: Billing robusto

Riesgo actual:

- El frontend puede enviar `planName` y `price`.
- El webhook no es idempotente.
- La asignacion de plan depende de descripcion textual.

Cambios:

- Crear modulo `billing`.
- Resolver planes y precios solo desde DB.
- Crear `Payment`, `Subscription` y `ProcessedWebhook` o equivalente.
- Validar origen/firma del webhook de MercadoPago.
- Hacer idempotente cada webhook.
- Auditar activaciones y cambios de plan.

Archivos principales:

- `backend/src/modules/mercadopago/`
- `backend/src/plans/`
- `backend/src/audit/`
- `backend/prisma/schema.prisma`
- `frontend/src/app/dashboard/billing/page.tsx`

Criterio de salida:

- El cliente solo envia `planCode`.
- Un webhook repetido no duplica activaciones.
- El plan activado coincide con el plan comprado en backend.

## Fase 5: Permisos y settings como contrato estable

Riesgo actual:

- `themePreference` se envia desde frontend pero backend no lo persiste.
- `planPermissions` se devuelve en login, pero puede perderse al refrescar con `getMe`.

Cambios:

- Crear DTO para settings.
- Persistir `themePreference`.
- Devolver `themePreference`, `planDetails` y `planPermissions` en `GET /users/me` o `GET /auth/me`.
- Centralizar calculo de permisos efectivos.

Archivos principales:

- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `frontend/src/components/dashboard/TopBar.tsx`
- `frontend/src/components/dashboard/Sidebar.tsx`

Criterio de salida:

- Cambiar tema persiste tras recargar.
- Los menus por plan no dependen de datos stale en `localStorage`.

## Fase 6: Redis, jobs y rate limits

Objetivo:

- Mejorar estabilidad operacional.
- Sacar tareas pesadas del request/response.

Cambios:

- Agregar Redis.
- Agregar rate limit para auth y endpoints publicos.
- Mover emails, push y recordatorios a jobs.
- Usar BullMQ si los jobs se vuelven relevantes.

Criterio de salida:

- Login y forgot-password tienen rate limit.
- Emails y notificaciones no bloquean requests criticos.

## Orden recomendado

1. Fase 1: reservas seguras.
2. Fase 5: settings/permisos, porque es pequena y reduce bugs visibles.
3. Fase 2: sesiones seguras.
4. Fase 4: billing robusto.
5. Fase 3: tenant explicito.
6. Fase 6: Redis/jobs/rate limit.

La Fase 3 es grande. Conviene hacerla despues de cerrar los riesgos de seguridad y contrato que ya existen.
