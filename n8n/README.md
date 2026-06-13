# Pichangaya Automation (n8n) ⚙️

Este directorio contiene las configuraciones y flujos de trabajo (workflows) para n8n, utilizados para automatizar la lógica de negocio e integrar diversos servicios en el ecosistema de Pichangaya.

## 🚀 Flujos de Trabajo (Workflows)

- **AI Agent Workflow:** (`ai_agent_workflow.json`) - Automatiza las interacciones y la lógica para las características impulsadas por IA de la plataforma.

## 🚦 Primeros Pasos

El servicio n8n se orquesta a través del `docker-compose.yml` de la raíz o el `docker-compose.yml` local en este directorio.

Para ejecutar localmente:
```bash
docker-compose up -d
```
La interfaz de n8n estará disponible en `http://localhost:5678`.
