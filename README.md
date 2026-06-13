# Pichangaya (FieldIQ) ⚽

## Documentacion tecnica

- [Arquitectura objetivo](docs/ARCHITECTURE.md): stack recomendado, sesiones, tenants, billing, permisos y deploy.
- [Plan de migracion](docs/MIGRATION_PLAN.md): fases de implementacion para mejorar el sistema sin romper flujos existentes.

Pichangaya (también conocido como FieldIQ) es una plataforma integral para la gestión de canchas deportivas, reservas y relaciones con los clientes. Aprovecha la IA para la predicción de la demanda y proporciona una interfaz moderna y receptiva tanto para los dueños de las canchas como para los jugadores.

## 🚀 Características Principales

- **Gestión de Reservas:** Programación y gestión en tiempo real de canchas deportivas.
- **Predicción de Demanda con IA:** Análisis inteligente de datos históricos para pronosticar tendencias futuras de reservas.
- **Configuración de Sedes y Canchas:** Configuración flexible para múltiples sedes y diversos tipos de canchas.
- **Roles y Permisos de Usuario:** Autenticación y autorización seguras para administradores, propietarios y clientes.
- **Notificaciones Automatizadas:** Integración con WhatsApp (vía Evolution API) y Correo Electrónico (vía Resend) para confirmaciones de reservas y recordatorios.
- **Panel de Análisis (Analytics):** Información visual sobre el rendimiento de las sedes y estadísticas de reservas.
- **Automatización de Flujos de Trabajo:** Integrado con n8n para lógica de negocios personalizada y automatizaciones.

## 🏗️ Arquitectura

El proyecto está estructurado como un monorepo que contiene varios microservicios:

- **`frontend/`**: Una aplicación web moderna construida con **Next.js 16**, **Tailwind CSS** y **Framer Motion/GSAP** para animaciones fluidas.
- **`backend/`**: Una API REST robusta potenciada por **NestJS**, utilizando **Prisma ORM** con **PostgreSQL**.
- **`ai-service/`**: Un servicio especializado para la predicción de la demanda utilizando **Python (FastAPI)** y aprendizaje automático (ML).
- **`evolution-api/`**: Pasarela de integración con WhatsApp para mensajería en tiempo real.
- **`n8n/`**: Motor de automatización de flujos de trabajo para conectar diversos servicios y manejar la lógica de negocio.

## 🛠️ Stack Tecnológico

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- GSAP & Framer Motion
- Lucide React (Iconos)
- Recharts (Analíticas)

### Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Autenticación JWT
- Mercado Pago (Pagos)
- Resend (Email)
- Web-Push (Notificaciones)

### AI Service
- Python
- FastAPI
- Scikit-learn / Pandas (para predicción de datos)

## 🚦 Primeros Pasos

### Requisitos Previos
- Docker y Docker Compose
- Node.js & pnpm (para desarrollo local)
- Python 3.10+ (para desarrollo local del servicio de IA)

### Configuración e Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd pichangaya
   ```

2. **Variables de Entorno:**
   Copia el archivo `.env.example` a `.env` y completa las credenciales requeridas.
   ```bash
   cp .env.example .env
   ```

3. **Ejecutar con Docker Compose:**
   ```bash
   docker-compose up -d
   ```
   Esto iniciará:
   - PostgreSQL (Puerto 5432)
   - Backend (Puerto 3001)
   - Frontend (Puerto 3000)
   - AI Service (Puerto 8000)
   - pgAdmin (Puerto 5050)

4. **Inicializar la Base de Datos:**
   ```bash
   cd backend
   pnpm install
   npx prisma migrate dev
   pnpm run seed
   ```

## 📂 Estructura del Proyecto

```text
pichangaya/
├── ai-service/       # Servicio Python FastAPI para predicción de demanda
├── backend/          # API REST NestJS y gestión de base de datos
├── evolution-api/    # Pasarela de integración con WhatsApp
├── frontend/         # Aplicación web Next.js
├── n8n/              # Configuraciones de flujos de trabajo en n8n
└── docker-compose.yml # Orquestación de todos los servicios
```

## 📄 Licencia

Este proyecto es [UNLICENSED](backend/package.json).
