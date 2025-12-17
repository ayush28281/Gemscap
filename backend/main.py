import asyncio
import json
import websockets
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_ohlc
from analytics import price_stats, zscore
from store import get_ticks
from store import add_tick, get_ticks
from resampler import aggregate
from store import get_ohlc
from fastapi.responses import Response

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BINANCE_WS = "wss://fstream.binance.com/ws"

clients: set[WebSocket] = set()


async def binance_stream(symbols: list[str]):
    streams = "/".join([f"{s}@trade" for s in symbols])
    url = f"{BINANCE_WS}/{streams}"

    async with websockets.connect(url) as ws:
        while True:
            msg = await ws.recv()
            data = json.loads(msg)

            tick = {
                "symbol": data["s"].lower(),
                "ts": data.get("T") or data.get("E"),
                "price": float(data["p"]),
                "size": float(data["q"]),
            }

        
            add_tick(tick)

            
            aggregate(tick["symbol"], tick)

            # ✅ broadcast tick to frontend
            dead = set()
            for client in clients:
                try:
                    await client.send_text(json.dumps(tick))
                except:
                    dead.add(client)

            for d in dead:
                clients.remove(d)


@app.websocket("/ws/market")
async def market_ws(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        clients.remove(websocket)


@app.get("/ohlc/{symbol}/{tf}")
def ohlc_api(symbol: str, tf: str):
    return get_ohlc(symbol, tf)


@app.get("/ticks/{symbol}")
def ticks_api(symbol: str):
    data = json.dumps(get_ticks(symbol))
    return Response(
        content=data,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={symbol}_ticks.json"}
    )


@app.get("/ticks/{symbol}")
def ticks_api(symbol: str):
    return get_ticks(symbol.lower())
    

@app.get("/ohlc/{symbol}/{tf}")
def get_ohlc(symbol: str, tf: str):
    rows = fetch_ohlc(symbol, tf)
    return [
        {
            "timestamp": r[0],
            "open": r[1],
            "high": r[2],
            "low": r[3],
            "close": r[4],
            "volume": r[5],
            "trades": r[6],
        }
        for r in rows
    ]



@app.on_event("startup")
async def startup():
    symbols = ["btcusdt", "ethusdt"]
    asyncio.create_task(binance_stream(symbols))
