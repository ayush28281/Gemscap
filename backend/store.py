# store.py
from collections import defaultdict, deque

MAX_TICKS = 10000
MAX_OHLC = 500

ticks = defaultdict(lambda: deque(maxlen=MAX_TICKS))
ohlc_store = defaultdict(lambda: defaultdict(deque))


def add_tick(tick):
    ticks[tick["symbol"]].append(tick)


def add_ohlc(symbol, tf, bar):
    ohlc_store[symbol][tf].append(bar)
    if len(ohlc_store[symbol][tf]) > MAX_OHLC:
        ohlc_store[symbol][tf].popleft()


def get_ticks(symbol):
    return list(ticks[symbol])


def get_ohlc(symbol, tf):
    return list(ohlc_store[symbol][tf])
