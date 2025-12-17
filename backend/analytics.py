# analytics.py
import statistics
from alerts import check_alerts

def price_stats(ticks):
    if not ticks:
        return {}

    prices = [t["price"] for t in ticks]

    return {
        "last": prices[-1],
        "high": max(prices),
        "low": min(prices),
        "mean": statistics.mean(prices),
    }


def zscore(series, window=20):
    if len(series) < window:
        return None

    recent = series[-window:]
    mean = statistics.mean(recent)
    std = statistics.stdev(recent)

    return (series[-1] - mean) / std if std else 0


def compute_analytics(symbol, ticks):
    prices = [t["price"] for t in ticks]

    z = zscore(prices)
    triggered = check_alerts(symbol, z) if z is not None else []

    return {
        "price_stats": price_stats(ticks),
        "zscore": z,
        "alerts": triggered,
    }
