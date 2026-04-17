import numpy as np
from datetime import datetime, timedelta

class DemandPredictor:
    def predict(self, historical_data):
        """
        historical_data: list of dicts with {'date': 'YYYY-MM-DD', 'bookings': count}
        """
        if not historical_data or len(historical_data) < 3:
            return {"prediction": 0.5, "status": "insufficient_data"}
        
        # Sort by date
        sorted_data = sorted(historical_data, key=lambda x: x['date'])
        
        counts = [x['bookings'] for x in sorted_data]
        
        # Simple weighted moving average
        weights = np.arange(1, len(counts) + 1)
        wma = np.dot(counts, weights) / weights.sum()
        
        # Basic trend factor (last slope)
        recent_trend = (counts[-1] - counts[0]) / len(counts)
        
        # Predict next value
        predicted_count = wma + recent_trend
        
        # Normalize to capacity (let's assume max capacity is 20 bookings per day for now)
        # In a real app, this would be per venue capacity
        capacity = 20
        occupancy_rate = min(max(predicted_count / capacity, 0), 1)
        
        return {
            "prediction": round(occupancy_rate, 2),
            "predicted_count": round(predicted_count, 1),
            "trend": "up" if recent_trend > 0 else "down",
            "confidence": 0.8 if len(historical_data) > 7 else 0.5
        }
