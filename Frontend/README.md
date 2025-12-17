# Quantitative Trading Analytics Dashboard

## Overview

This project is a **real-time quantitative analytics dashboard** designed as an evaluation assignment for a Quant / Trading Systems role. It demonstrates an **end-to-end analytical workflow** starting from live market data ingestion to quantitative analysis, alerting, visualization, and data export.

The application consumes **live tick-level data from Binance Futures WebSocket**, processes and aggregates it into multiple timeframes, computes commonly used **statistical-arbitrage analytics**, and presents the results through an **interactive web-based dashboard**.

The system is intentionally designed as a **research and trader-assist tool**, focusing on clarity, modularity, and extensibility rather than production-scale optimization.

---

## Key Objectives Addressed

* Real-time market data ingestion
* Time-based resampling (1s / 1m / 5m)
* Quantitative analytics for relative-value trading
* Interactive visualization and dashboards
* Rule-based alerting
* Data export for downstream research
* Clean, modular architecture suitable for extension

---

## Architecture Overview

```
Binance WebSocket (Live Ticks)
          ↓
Ingestion Layer (WebSocket Hooks)
          ↓
In-Memory Store (Ticks + OHLC Aggregation)
          ↓
Analytics Engine (Stats, Regression, Spread)
          ↓
Alert Engine (Rule-based)
          ↓
React Dashboard (Charts, Tables, Controls)
```

**Design Philosophy**

* Loose coupling between ingestion, storage, analytics, and UI
* Clear separation of concerns
* Designed for easy replacement of data sources or analytics modules

---

## Technology Stack

### Frontend

* **React + TypeScript** – UI and state management
* **Vite** – Fast development and bundling
* **shadcn/ui + Radix UI** – Component system
* **Tailwind CSS** – Styling
* **Recharts** – Interactive charts
* **Framer Motion** – UI animations

### Analytics & Utilities

* **simple-statistics** – Statistical computations

### Data Source

* **Binance Futures WebSocket API** (trade stream)

---

## Core Features

### 1. Live Market Data Ingestion

* Connects to Binance Futures WebSocket streams
* Supports multiple symbols simultaneously
* Normalizes tick data into a unified internal format

Tick format:

```
{ timestamp, symbol, price, quantity }
```

---

### 2. Timeframe Aggregation

Tick data is aggregated into OHLC bars using event-time logic:

* 1 second (1s)
* 1 minute (1m)
* 5 minutes (5m)

Each OHLC bar contains:

* Open, High, Low, Close
* Volume
* Number of trades

---

### 3. Quantitative Analytics

The following analytics are computed dynamically as data becomes available:

#### Price Statistics

* Last price
* Absolute and percentage change
* High / Low
* Volume
* VWAP

#### Hedge Ratio (OLS Regression)

* Ordinary Least Squares regression between two assets
* Estimates hedge ratio (β)
* Computes R² and correlation

#### Spread & Z-Score

* Spread = Y − βX
* Rolling mean and standard deviation
* Z-score for mean-reversion signals

#### Stationarity Check (ADF Test)

* Simplified Augmented Dickey-Fuller test
* Triggered once sufficient data is available
* Used for research validation, not trading decisions

#### Rolling Correlation

* Rolling correlation between asset prices

---

### 4. Live vs Resampled Analytics

Different analytics update on different natural frequencies:

| Metric           | Update Frequency  |
| ---------------- | ----------------- |
| Prices           | Live / Tick-level |
| Spread & Z-score | Sub-second        |
| Correlation      | Rolling window    |
| ADF Test         | On-demand         |

This avoids unnecessary computation while preserving responsiveness.

---

### 5. Interactive Dashboard

The dashboard provides:

* Symbol selection
* Timeframe selection
* Rolling window configuration
* Live connection controls
* Zoomable and hover-enabled charts

Visual modules include:

* Price charts
* Spread and Z-score charts
* Correlation charts
* Volume charts
* Summary statistics panels

---

### 6. Alerting System

Users can define **rule-based alerts**, such as:

* Z-score above or below a threshold
* Price-based conditions
* Spread-based conditions

Alerts are:

* Evaluated in near-real-time
* Displayed visually in the UI
* Logged with timestamps

---

### 7. Data Export

The system supports exporting:

* **Raw tick data** (CSV / JSON)
* **OHLC data** for selected timeframe

This enables:

* Offline analysis
* Backtesting
* Research workflows

---

## Running the Application

### Prerequisites

* Node.js (v18+ recommended)
* npm

### Installation & Run

```bash
npm install
npm run dev
```

The application will start locally and open in the browser.

---

## Scaling & Extensibility Notes

Although this project runs locally, it is designed with scalability in mind:

* WebSocket ingestion can be replaced with other feeds (CME, REST, FIX)
* Storage layer can be swapped for Redis, DuckDB, or time-series databases
* Analytics engine can be extended with:

  * Kalman Filters
  * Robust regression techniques
  * Backtesting modules
* UI components are modular and reusable

The current architecture allows these extensions without rewriting core logic.

---

## ChatGPT / AI Usage Disclosure

ChatGPT was used to:

* Assist with boilerplate generation
* Validate analytics formulations
* Improve code structure and documentation clarity

All design decisions, analytics logic, and integration choices were reviewed and implemented manually.

---

## Disclaimer

This application is for **educational and evaluation purposes only**.

It is **not intended for live trading**, investment decisions, or financial advice.
