from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from predictor import DemandPredictor

app = FastAPI(title="FieldIQ AI Service")
predictor = DemandPredictor()

class HistoricalItem(BaseModel):
    date: str
    bookings: int

class PredictionRequest(BaseModel):
    historical_data: List[HistoricalItem]

@app.get("/")
def read_root():
    return {"message": "FieldIQ AI Service is running"}

@app.post("/predict")
def get_prediction(request: PredictionRequest):
    try:
        data = [item.dict() for item in request.historical_data]
        result = predictor.predict(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
