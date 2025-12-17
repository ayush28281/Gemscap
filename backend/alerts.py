# alerts.py
ALERTS = {
    "btcusdt": {"z_gt": 2},
    "ethusdt": {"z_gt": 2},
}

def check_alerts(symbol, z):
    if z is None:
        return []

    rules = ALERTS.get(symbol, {})
    alerts = []

    if "z_gt" in rules and abs(z) >= rules["z_gt"]:
        alerts.append({
            "type": "Z_SCORE",
            "symbol": symbol,
            "value": z,
            "message": f"Z-score threshold breached: {z:.2f}"
        })

    return alerts
