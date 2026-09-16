"""
Lightweight forecasting for revenue / expense / cash-flow trends.

Uses scikit-learn's LinearRegression over monthly aggregates when there
is enough history, and falls back to a moving-average projection for
very small datasets. This keeps the model dependency-light while still
being a real, trainable model rather than a hardcoded guess.
"""
from datetime import date

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from app.ml.preprocessing import monthly_totals, transactions_to_dataframe


def forecast_series(rows: list[tuple[date, float]], periods_ahead: int = 3) -> dict:
    """
    rows: list of (date, amount) tuples (e.g. all income transactions).
    Returns a dict with the method used and forecast points.
    """
    df = transactions_to_dataframe(rows)
    series = monthly_totals(df)

    if len(series) == 0:
        return {"method": "insufficient_data", "history_points_used": 0, "forecast": []}

    if len(series) < 3:
        # Not enough history for regression -> naive average projection.
        avg = float(series.mean())
        last_period = series.index[-1]
        forecast = []
        for i in range(1, periods_ahead + 1):
            period = (last_period + pd.DateOffset(months=i)).strftime("%Y-%m")
            forecast.append({"period": period, "predicted_value": round(avg, 2)})
        return {"method": "moving_average", "history_points_used": len(series), "forecast": forecast}

    # Linear regression on month index -> amount.
    X = np.arange(len(series)).reshape(-1, 1)
    y = series.values
    model = LinearRegression()
    model.fit(X, y)

    last_period = series.index[-1]
    future_X = np.arange(len(series), len(series) + periods_ahead).reshape(-1, 1)
    predictions = model.predict(future_X)

    forecast = []
    for i, pred in enumerate(predictions, start=1):
        period = (last_period + pd.DateOffset(months=i)).strftime("%Y-%m")
        forecast.append({"period": period, "predicted_value": round(max(float(pred), 0.0), 2)})

    return {"method": "linear_regression", "history_points_used": len(series), "forecast": forecast}
