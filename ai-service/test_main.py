import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app, PredictionRequest, HistoricalItem

class TestMain(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_read_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "FieldIQ AI Service is running"})

    @patch("main.predictor.predict")
    def test_get_prediction_success(self, mock_predict):
        # Setup mock return value
        mock_predict.return_value = {
            "prediction": 0.75,
            "predicted_count": 15.0,
            "trend": "up",
            "confidence": 0.8
        }

        # Setup test data
        payload = {
            "historical_data": [
                {"date": "2023-01-01", "bookings": 10},
                {"date": "2023-01-02", "bookings": 12},
                {"date": "2023-01-03", "bookings": 14}
            ]
        }

        response = self.client.post("/predict", json=payload)

        # Verify status code and response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "prediction": 0.75,
            "predicted_count": 15.0,
            "trend": "up",
            "confidence": 0.8
        })

        # Verify mock was called correctly
        expected_data = [
            {"date": "2023-01-01", "bookings": 10},
            {"date": "2023-01-02", "bookings": 12},
            {"date": "2023-01-03", "bookings": 14}
        ]
        mock_predict.assert_called_once_with(expected_data)

    @patch("main.predictor.predict")
    def test_get_prediction_exception(self, mock_predict):
        # Make the mock raise an exception
        mock_predict.side_effect = Exception("Test Error")

        payload = {
            "historical_data": [
                {"date": "2023-01-01", "bookings": 10}
            ]
        }

        response = self.client.post("/predict", json=payload)

        # Verify it returns a 500 error
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": "Test Error"})

    def test_get_prediction_invalid_data(self):
        # Invalid data (missing required 'historical_data' field)
        payload = {}

        response = self.client.post("/predict", json=payload)

        # Verify it returns a 422 error
        self.assertEqual(response.status_code, 422)

        # Further testing invalid item data (missing 'bookings')
        payload = {
            "historical_data": [
                {"date": "2023-01-01"}
            ]
        }

        response = self.client.post("/predict", json=payload)
        self.assertEqual(response.status_code, 422)

if __name__ == "__main__":
    unittest.main()
