# Arquitectura objetivo

Este documento define hacia donde debe evolucionar Pichangaya para operar como SaaS multi-tenant sin romper el producto actual. La regla general es hacer migraciones pequenas, verificables y compatibles hacia atras.

## Objetivos

- Aislar datos por tenant de forma explicita.
- Evitar que la sesion dependa de `localStorage`.
- Centralizar permisos, limites de plan y reglas de negocio en el backend.
- Hacer pagos y webhooks idempotentes.
- Mantener el frontend como consumidor simple de estado autenticado.
- Separar servicios solo cuando haya una razon operacional clara.

## Stack recomendado

```txt
frontend/        Next.js App Router, Tailwind, dashboard y landing
backend/         NestJS, API principal, auth, negocio, billing, auditoria
postgres         Base de datos transaccional
redis            Sesiones, rate limit, colas y cache operacional
ai-service/      FastAPI solo si la IA crece fuera de predicciones simples
n8n/             Automatizaciones no criticas o prototipos
evolution-api/   Integracion WhatsApp
```

## Responsabilidades por capa

### Frontend

El frontend debe encargarse de interfaz, navegacion, formularios y experiencia de usuario. No debe decidir permisos reales ni guardar tokens sensibles de larga vida.

Mantener:

- Next.js para landing, dashboard y flujos de pago.
- Componentes por dominio: `bookings`, `venues`, `billing`, `admin`, `shared`.
- Un cliente API centralizado.

Cambiar:

- Dejar de guardar la sesion completa en `localStorage`.
- Usar `GET /auth/me` como fuente de verdad para usuario, tenant, plan y permisos.
- Tratar redirecciones del dashboard como UX, no como seguridad.

### Backend

NestJS debe ser el core del negocio. Las reglas importantes viven aqui.

Estructura objetivo:

```txt
backend/src
  common/
    decorators/
    dto/
    filters/
    guards/
    pipes/
  config/
  auth/
  users/
  tenants/
  venues/
  fields/
  bookings/
  clients/
  billing/
    mercadopago/
    invoices/
    plans/
    subscriptions/
  notifications/
  audit/
  ai-tools/
  prisma/
```

Reglas:

- Todo endpoint privado pasa por `JwtAuthGuard`.
- Todo acceso operativo filtra por `tenantId`.
- Las reglas de plan se validan en backend.
- Los webhooks son idempotentes.
- Los errores de dominio usan excepciones HTTP de Nest, no `Error` generico.

### Base de datos

El modelo actual usa `User ADMIN` como propietario. Funciona para MVP, pero complica equipos, permisos y auditoria. La direccion recomendada es introducir `Tenant`.

Modelo objetivo conceptual:

```txt
Tenant
User
TenantMembership
Venue
Field
Client
Booking
Plan
Subscription
Payment
ProcessedWebhook
Session
AuditLog
PushSubscription
```

Reglas:

- `Venue`, `Field`, `Client`, `Booking`, `Payment` y `AuditLog` deben poder resolverse por `tenantId`.
- `User` no debe representar por si solo al negocio.
- Los soft deletes deben aplicarse consistentemente.
- Las reservas necesitan proteccion a nivel transaccional contra solapamientos.

## Sesiones y autenticacion

No usar `localStorage` para refresh tokens ni sesiones de larga vida.

Flujo objetivo:

```txt
POST /auth/login
  valida credenciales
  crea Session
  set-cookie refresh_token httpOnly
  devuelve access_token corto + user

POST /auth/refresh
  lee refresh_token desde cookie
  valida Session
  rota refresh token
  devuelve nuevo access_token

POST /auth/logout
  revoca Session
  limpia cookie

GET /auth/me
  devuelve usuario actual, tenant activo, plan y permisos
```

Tokens:

- Access token: 10 a 15 minutos.
- Refresh token: 7 a 30 dias.
- Refresh token en cookie `httpOnly`, `Secure`, `SameSite=Lax`.
- Access token en memoria del frontend.
- Refresh tokens guardados como hash en DB o Redis.

Payload JWT recomendado:

```ts
{
  sub: userId,
  sessionId,
  tenantId,
  role
}
```

Modelo Prisma recomendado:

```prisma
model Session {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshHash  String
  userAgent    String?
  ipAddress    String?
  revokedAt    DateTime?
  expiresAt    DateTime
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([expiresAt])
}
```

## Autorizacion

Separar identidad, tenant y permisos.

- `JwtAuthGuard`: valida access token y sesion.
- `TenantGuard`: asegura tenant activo.
- `RolesGuard`: valida rol del usuario.
- `PlanGuard`: valida features y limites.
- Services: siempre consultan y mutan datos filtrando por `tenantId`.

Los permisos del frontend son solo para mostrar u ocultar UI. El backend siempre vuelve a validar.

## Billing y MercadoPago

El cliente no debe enviar precios confiables. El backend resuelve el plan desde DB.

Flujo objetivo:

```txt
POST /billing/checkout
  body: { planCode }
  backend busca plan activo
  backend crea preference/subscription con precio server-side
  backend guarda Payment pendiente

POST /billing/mercadopago/webhook
  valida origen/firma
  consulta pago en MercadoPago
  verifica external_reference/metadata
  ignora si ya fue procesado
  actualiza Payment y Subscription
```

Reglas:

- Guardar `paymentId` o `webhookEventId` procesado.
- No extender suscripcion dos veces por el mismo pago.
- No inferir plan desde descripcion textual.
- Auditar cambios de plan y activaciones.

## Reservas

Las reservas deben cumplir tres condiciones:

- La cancha pertenece al tenant actual.
- El cliente pertenece al mismo tenant o queda vacio.
- No existe solapamiento con reservas activas.

La validacion de solapamiento debe ser transaccional. Idealmente se refuerza en DB con una restriccion de exclusion de Postgres cuando el modelo este listo para ello.

## IA y automatizaciones

Mantener `ai-service` separado solo si necesita dependencias o compute propios. Si la IA sigue siendo una prediccion simple, puede vivir como modulo del backend.

`n8n` debe quedar para automatizaciones no criticas. Los procesos centrales, como pagos, sesiones y reservas, deben vivir en backend.

## Deploy recomendado

Produccion simple:

```txt
Frontend: Vercel o Docker
Backend: Railway, Fly.io, Render o VPS Docker
Postgres: servicio administrado
Redis: Upstash, Railway Redis o servicio administrado
AI service: separado solo si aporta valor operacional
Email: Resend
Payments: MercadoPago
Storage: S3 compatible si se agregan imagenes
```

No exponer publicamente Postgres ni pgAdmin en produccion.
