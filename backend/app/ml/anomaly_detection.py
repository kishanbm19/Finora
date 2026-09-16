"""
Anomaly detection for financial transactions.

Uses a z-score based approach per category: any transaction amount that
deviates significantly from that category's historical mean is flagged.
This is simple, explainable, and works well with limited data - a good
fit for an SME's transaction volume. Swappable later for an IsolationForest
model as data volume grows.
"""
from dataclasses import dataclass

import numpy as np


@dataclass
class TransactionRecord:
    id: str
    amount: float
    category: str
    transaction_date: str


def detect_anomalies(transactions: list[TransactionRecord], z_threshold: float = 2.5) -> list[dict]:
    if len(transactions) < 5:
        return []  # not enough data to establish a meaningful baseline

    by_category: dict[str, list[TransactionRecord]] = {}
    for t in transactions:
        by_category.setdefault(t.category, []).append(t)

    anomalies: list[dict] = []
    for category, txs in by_category.items():
        amounts = np.array([t.amount for t in txs])
        if len(amounts) < 4:
            continue  # skip categories with too little history

        mean = amounts.mean()
        std = amounts.std()
        if std == 0:
            continue

        for t in txs:
            z_score = (t.amount - mean) / std
            if abs(z_score) >= z_threshold:
                severity = "critical" if abs(z_score) >= 4 else "warning"
                direction = "higher" if z_score > 0 else "lower"
                anomalies.append(
                    {
                        "transaction_id": t.id,
                        "amount": t.amount,
                        "category": category,
                        "transaction_date": t.transaction_date,
                        "reason": (
                            f"Amount is {abs(round(z_score, 1))} standard deviations {direction} "
                            f"than the typical '{category}' transaction (avg {round(mean, 2)})."
                        ),
                        "severity": severity,
                    }
                )

    return anomalies
