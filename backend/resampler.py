# resampler.py
from collections import defaultdict
from datetime import datetime
from store import add_ohlc

TIMEFRAMES = {
    "1s": 1,
    "1m": 60,
    "5m": 300,
}

buffers = defaultdict(lambda: defaultdict(list))
last_bucket = defaultdict(dict)


def aggregate(symbol, tick):
    ts = tick["ts"] / 1000
    results = []

    for tf, seconds in TIMEFRAMES.items():
        bucket = int(ts // seconds) * seconds

        if tf not in last_bucket[symbol]:
            last_bucket[symbol][tf] = bucket

        buffers[symbol][tf].append(tick)

        if bucket > last_bucket[symbol][tf]:
            data = buffers[symbol][tf]
            prices = [t["price"] for t in data]

            bar = {
                "timestamp": datetime.utcfromtimestamp(last_bucket[symbol][tf]).isoformat(),
                "open": prices[0],
                "high": max(prices),
                "low": min(prices),
                "close": prices[-1],
                "volume": sum(t["size"] for t in data),
                "trades": len(data),
            }

            add_ohlc(symbol, tf, bar)
            buffers[symbol][tf] = []
            last_bucket[symbol][tf] = bucket

            results.append((tf, bar))

    return results
