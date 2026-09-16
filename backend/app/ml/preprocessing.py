"""
Shared data-preparation helpers for the ML module.

Converts raw ORM rows into pandas-friendly monthly time series that
forecasting.py and anomaly_detection.py can consume.
"""
from datetime import date

import pandas as pd


def transactions_to_dataframe(rows: list[tuple[date, float]]) -> pd.DataFrame:
    """rows: list of (transaction_date, amount) tuples."""
    if not rows:
        return pd.DataFrame(columns=["date", "amount"])
    df = pd.DataFrame(rows, columns=["date", "amount"])
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date")


def monthly_totals(df: pd.DataFrame) -> pd.Series:
    """Aggregate a (date, amount) dataframe into a monthly-indexed series."""
    if df.empty:
        return pd.Series(dtype=float)
    series = df.set_index("date")["amount"].resample("MS").sum()
    return series
