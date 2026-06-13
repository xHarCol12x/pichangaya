# Pichangaya AI Service 🤖

Este servicio proporciona capacidades de predicción de la demanda para la plataforma Pichangaya utilizando datos históricos de reservas.

## 🚀 Características

- **Predicción de Demanda:** Predice tendencias futuras de reservas basadas en datos históricos.
- **FastAPI:** API REST de alto rendimiento construida con Python.

## 🛠️ Stack Tecnológico

- Python 3.10+
- FastAPI
- Uvicorn (Servidor ASGI)
- Scikit-learn / Pandas (para análisis de datos y predicción)

## 🚦 Primeros Pasos

### Requisitos Previos
- Python 3.10+
- pip

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ejecutar el servicio:**
   ```bash
   python main.py
   ```
   El servicio estará disponible en `http://localhost:8000`.

## 📡 Endpoints de la API

### `GET /`
Verifica si el servicio está funcionando.

### `POST /predict`
Envía datos históricos para recibir predicciones de demanda.

**Cuerpo de la Petición (Request Body):**
```json
{
  "historical_data": [
    { "date": "2023-10-01", "bookings": 10 },
    { "date": "2023-10-02", "bookings": 15 }
  ]
}
```
