# ⚽ Pichangaya (FieldIQ)

<div align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/NestJS%2011-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/Python%20FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/n8n-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white" alt="n8n">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</div>

<br />

**Pichangaya (FieldIQ)** es una plataforma SaaS de alto rendimiento para la gestión integral de complejos deportivos, reservas de canchas en tiempo real y automatizaciones omnicanal impulsadas por **Inteligencia Artificial y Bots de WhatsApp**.

---

## 🌟 Características Destacadas

- **📅 Reservas en Tiempo Real:** Calendario interactivo y gestión dinámica de horarios de canchas deportivas.
- **🤖 Agentes Conversacionales en WhatsApp:** Integración con **Evolution API** y **n8n** para consulta de disponibilidad y reservas automáticas vía chat.
- **📈 Predicción de Demanda con IA:** Microservicio en Python (FastAPI + Scikit-learn) que analiza el historial de reservas para pronosticar demanda y sugerir precios dinámicos.
- **💳 Pasarelas de Pago Integradas:** Cobros automáticos y generación de enlaces de pago directo con **Mercado Pago** y **Stripe**.
- **📊 Dashboard de Analíticas:** Paneles visuales interactivos con Recharts, estadísticas de facturación, tasa de ocupación y retención de clientes.
- **🔔 Notificaciones Multicanal:** Web Push notifications a navegadores y correos transaccionales con **Resend**.

---

## 🏗️ Arquitectura del Sistema

```text
                               ┌─────────────────────────┐
                               │   Next.js 16 Frontend   │
                               │  (React 19 + Tailwind)  │
                               └────────────┬────────────┘
                                            │ HTTP / REST
                                            ▼
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│  FastAPI (Python AI)    │◄───┤    NestJS 11 Backend    ├───►│  PostgreSQL Database    │
│  (Demand Predictor ML)  │    │  (Prisma ORM + JWT)     │    │  (Prisma Schema)        │
└─────────────────────────┘    └────────────┬────────────┘    └─────────────────────────┘
                                            │ Event Triggers
                                            ▼
                               ┌─────────────────────────┐
                               │  Evolution API + n8n    │
                               │  (WhatsApp Automation)  │
                               └─────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías Utilizadas |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Recharts, Framer Motion, GSAP |
| **Backend API** | NestJS 11, Prisma ORM 6, Passport JWT, Schedule (Cron), EventEmitter |
| **Microservicio IA** | Python 3.10+, FastAPI, Scikit-learn, Pandas |
| **Integraciones & Bots** | Evolution API (WhatsApp Gateway), n8n Workflow Engine, Resend, Mercado Pago SDK, Stripe SDK |
| **Infraestructura** | PostgreSQL 15, Docker, Docker Compose, Redis |

---

## 🚦 Primeros Pasos

### 📋 Requisitos Previos
- Node.js 20+ y `pnpm`
- Python 3.10+
- Docker & Docker Compose

### 🔧 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/xHarCol12x/pichangaya.git
   cd pichangaya
   ```

2. **Configurar Variables de Entorno:**
   Copia el archivo de ejemplo y completa las credenciales:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar entorno con Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Ejecutar Migraciones y Datos Semilla:**
   ```bash
   cd backend
   pnpm install
   npx prisma migrate dev
   pnpm run seed
   ```

---

## 👤 Autor

Desarrollado por **Harol Fabricio Colán León**  
🎓 *Universidad Nacional José Faustino Sánchez Carrión*  
🔗 [GitHub: @xHarCol12x](https://github.com/xHarCol12x) | [LinkedIn](https://linkedin.com/in/harol-colan)
