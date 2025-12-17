import sqlite3

conn = sqlite3.connect("market.db", check_same_thread=False)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS ohlc (
    symbol TEXT,
    timeframe TEXT,
    timestamp TEXT,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume REAL,
    trades INTEGER
)
""")

conn.commit()


def insert_ohlc(symbol, tf, bar):
    cur.execute("""
    INSERT INTO ohlc VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        symbol,
        tf,
        bar["timestamp"],
        bar["open"],
        bar["high"],
        bar["low"],
        bar["close"],
        bar["volume"],
        bar["trades"],
    ))
    conn.commit()


def fetch_ohlc(symbol, tf):
    cur.execute("""
    SELECT timestamp, open, high, low, close, volume, trades
    FROM ohlc
    WHERE symbol=? AND timeframe=?
    ORDER BY timestamp
    """, (symbol, tf))
    return cur.fetchall()
