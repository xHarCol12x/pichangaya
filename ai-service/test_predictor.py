import unittest
from predictor import DemandPredictor

class TestDemandPredictor(unittest.TestCase):
    def setUp(self):
        self.predictor = DemandPredictor()

    def test_insufficient_data(self):
        # Test None
        result = self.predictor.predict(None)
        self.assertEqual(result, {"prediction": 0.5, "status": "insufficient_data"})

        # Test empty
        result = self.predictor.predict([])
        self.assertEqual(result, {"prediction": 0.5, "status": "insufficient_data"})

        # Test < 3 items
        data = [
            {'date': '2023-01-01', 'bookings': 5},
            {'date': '2023-01-02', 'bookings': 10}
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result, {"prediction": 0.5, "status": "insufficient_data"})

    def test_exact_3_items(self):
        # 3 items should give 0.5 confidence
        data = [
            {'date': '2023-01-01', 'bookings': 10},
            {'date': '2023-01-02', 'bookings': 10},
            {'date': '2023-01-03', 'bookings': 10}
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result['confidence'], 0.5)
        self.assertEqual(result['trend'], 'down')  # recent_trend = (10-10)/3 = 0, so "down"
        self.assertEqual(result['predicted_count'], 10.0) # wma = 10, trend = 0 -> 10.0
        self.assertEqual(result['prediction'], 0.5) # 10/20 = 0.5

    def test_greater_than_7_items(self):
        # > 7 items should give 0.8 confidence
        data = [{'date': f'2023-01-0{i}', 'bookings': 10} for i in range(1, 9)]
        result = self.predictor.predict(data)
        self.assertEqual(result['confidence'], 0.8)

    def test_trend_up(self):
        data = [
            {'date': '2023-01-01', 'bookings': 5},
            {'date': '2023-01-02', 'bookings': 10},
            {'date': '2023-01-03', 'bookings': 15}
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result['trend'], 'up')
        # wma: weights=[1,2,3], counts=[5,10,15]. dot=5+20+45=70. sum=6. wma=70/6=11.666
        # trend: (15-5)/3 = 10/3 = 3.333
        # predicted_count: 11.666 + 3.333 = 15.0
        self.assertAlmostEqual(result['predicted_count'], 15.0, places=1)
        self.assertAlmostEqual(result['prediction'], 15.0/20.0, places=2)

    def test_trend_down(self):
        data = [
            {'date': '2023-01-01', 'bookings': 15},
            {'date': '2023-01-02', 'bookings': 10},
            {'date': '2023-01-03', 'bookings': 5}
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result['trend'], 'down')
        # wma: weights=[1,2,3], counts=[15,10,5]. dot=15+20+15=50. sum=6. wma=50/6=8.333
        # trend: (5-15)/3 = -10/3 = -3.333
        # predicted_count: 8.333 - 3.333 = 5.0
        self.assertAlmostEqual(result['predicted_count'], 5.0, places=1)
        self.assertAlmostEqual(result['prediction'], 5.0/20.0, places=2)

    def test_occupancy_upper_bound(self):
        data = [
            {'date': '2023-01-01', 'bookings': 100},
            {'date': '2023-01-02', 'bookings': 100},
            {'date': '2023-01-03', 'bookings': 100}
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result['prediction'], 1.0) # clamped to 1.0

    def test_occupancy_lower_bound(self):
        data = [
            {'date': '2023-01-01', 'bookings': 0},
            {'date': '2023-01-02', 'bookings': 0},
            {'date': '2023-01-03', 'bookings': -10} # forcing negative predicted_count
        ]
        result = self.predictor.predict(data)
        self.assertEqual(result['prediction'], 0.0) # clamped to 0.0

    def test_out_of_order_dates(self):
        data = [
            {'date': '2023-01-03', 'bookings': 15},
            {'date': '2023-01-01', 'bookings': 5},
            {'date': '2023-01-02', 'bookings': 10}
        ]
        result_out_of_order = self.predictor.predict(data)

        data_sorted = [
            {'date': '2023-01-01', 'bookings': 5},
            {'date': '2023-01-02', 'bookings': 10},
            {'date': '2023-01-03', 'bookings': 15}
        ]
        result_sorted = self.predictor.predict(data_sorted)

        self.assertEqual(result_out_of_order, result_sorted)

if __name__ == '__main__':
    unittest.main()
