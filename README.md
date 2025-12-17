# 📈 Quantitative Trading Analytics Dashboard

> **Real-time quantitative analytics platform** built for a **Quant Developer evaluation**, showcasing an end-to-end trading analytics pipeline — from live market data ingestion to statistical analysis and interactive visualization.

---

## 🚀 Project Demo

🎥 **Live Demo Video**  
👉 **YouTube URL:** _[Add your demo video link here]_

```
https://www.youtube.com/watch?v=YOUR_VIDEO_ID
```

---

##  Overview

This project demonstrates a **complete client–server quantitative trading analytics system** using live market data from **Binance Futures**.

The focus is on:
- Clean system architecture
- Backend-driven quantitative analytics
- Real-time data processing
- Interactive visualization

It is designed as a **research and trader-assist tool**, not a production trading system.

---

## 🏗️ High-Level Architecture

```
┌──────────────────────────┐
│ Binance Futures WebSocket│
│   (btcusdt@trade etc.)   │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Python Backend (FastAPI) │
│                          │
│ • WebSocket Ingestion    │
│ • Tick Store (in-memory) │
│ • OHLC Resampler         │
│ • Analytics Engine       │
│ • Alert Engine           │
│ • REST + WS APIs         │
└─────────────┬────────────┘
              │
      REST / WebSocket
              │
              ▼
┌──────────────────────────┐
│ React Frontend Dashboard │
│                          │
│ • Live Charts            │
│ • Analytics Panels       │
│ • Alerts UI              │
│ • Data Export            │
└──────────────────────────┘
```

---

## 🧩 Technology Stack

### Backend
- Python 3.10+
- FastAPI
- asyncio + websockets
- In-memory data store (pluggable with Redis / DuckDB)

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts
- Framer Motion

---

## 🔄 Data Flow

```
Binance Tick
 → Backend WebSocket
 → Tick Store
 → OHLC Resampler (1s / 1m / 5m)
 → Analytics Engine
 → Alert Engine
 → REST / WS API
 → Frontend Dashboard
```

---

## ⚙️ Core Features

### 1️⃣ Live Market Data Ingestion
- Binance Futures WebSocket streams
- Multi-symbol support
- Normalized tick format

```json
{
  "symbol": "btcusdt",
  "ts": 1765964997928,
  "price": 86449.4,
  "size": 0.011
}
```

---

### 2️⃣ Timeframe Aggregation (OHLC)
Supported timeframes:
- 1 second
- 1 minute
- 5 minutes

Each bar includes:
- Open, High, Low, Close
- Volume
- Trade count

Endpoint:
```
GET /ohlc/{symbol}/{timeframe}
```

---

### 3️⃣ Quantitative Analytics (Backend)
- Price statistics (mean, high, low)
- OLS regression (hedge ratio)
- Spread & Z-score
- Rolling correlation
- Stationarity check (ADF)

---

### 4️⃣ Alert Engine
- Z-score threshold alerts
- Price-based conditions
- Real-time backend evaluation

---

### 5️⃣ Interactive Frontend Dashboard
- Symbol & timeframe selection
- Rolling window controls
- Live charts with zoom & hover
- Analytics panels
- Alert visualization

---

### 6️⃣ Data Export
- Tick data (CSV / JSON)
- OHLC bars (CSV)
- Designed for research & backtesting

---

## ▶️ Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URL:
```
http://127.0.0.1:8000
```

### Frontend
```bash
npm install
npm run dev
```

---

## 📈 Extensibility & Scaling

- Replace Binance with CME / FIX feeds
- Swap in-memory store with Redis / DuckDB
- Extend analytics:
  - Kalman Filters
  - Robust regression
  - Strategy backtesting
- Horizontal scaling via message queues

---

## 🤖 AI Usage Disclosure

ChatGPT was used for:
- Boilerplate generation
- Debugging assistance
- Documentation refinement

All system design, analytics logic, and integration decisions were implemented and validated manually.

---

## ⚠️ Disclaimer

It does **not** constitute financial advice and is **not intended for live trading**.
