import { create } from 'zustand'

export type PricePoint = { time: number; price: number }

export type Coin = {
  symbol: string
  price: number
  open24h: number
  high24h: number
  low24h: number
  volumeBase: number
  volumeQuote: number
  change24h: number
  updatedAt: number
  history: PricePoint[]
}

type MarketState = {
  symbols: string[]
  coins: Record<string, Coin>
  isConnected: boolean
  error?: string
  useMock: boolean
  connect: (symbols?: string[]) => void
  disconnect: () => void
  setSymbols: (symbols: string[]) => void
}

const DEFAULT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
]

let ws: WebSocket | null = null
let mockTimer: number | null = null

function now(): number { return Date.now() }

function ensureHistory(history: PricePoint[], next: PricePoint, max = 600): PricePoint[] {
  const arr = [...history, next]
  if (arr.length > max) arr.shift()
  return arr
}

function startMockFeed(get: () => MarketState, set: (fn: (s: MarketState) => Partial<MarketState> | Partial<MarketState>) => void) {
  const starting: Record<string, number> = {
    BTCUSDT: 68000, ETHUSDT: 2800, BNBUSDT: 520, SOLUSDT: 160, XRPUSDT: 0.55,
    ADAUSDT: 0.44, DOGEUSDT: 0.12, AVAXUSDT: 30, DOTUSDT: 6.5, MATICUSDT: 0.8,
  }
  const seedCoins: Record<string, Coin> = {}
  const t = now()
  for (const sym of get().symbols) {
    const p = starting[sym] ?? 1
    seedCoins[sym] = {
      symbol: sym,
      price: p,
      open24h: p * (1 - 0.01 + Math.random() * 0.02),
      high24h: p * 1.05,
      low24h: p * 0.95,
      volumeBase: 0,
      volumeQuote: 0,
      change24h: 0,
      updatedAt: t,
      history: [{ time: t, price: p }],
    }
  }
  set((s) => ({ coins: { ...s.coins, ...seedCoins }, isConnected: true }))

  const tick = () => {
    const st = get()
    const tNow = now()
    const updated: Record<string, Coin> = {}
    for (const sym of st.symbols) {
      const last = st.coins[sym]
      const drift = 1 + (Math.random() - 0.5) * 0.003
      const price = Math.max(0.0001, last ? last.price * drift : (starting[sym] ?? 1))
      const open24h = last?.open24h ?? price * 0.99
      const change24h = (price - open24h) / open24h
      const coin: Coin = {
        symbol: sym,
        price,
        open24h,
        high24h: Math.max(price, last?.high24h ?? price),
        low24h: Math.min(price, last?.low24h ?? price),
        volumeBase: (last?.volumeBase ?? 0) + Math.random() * 5,
        volumeQuote: (last?.volumeQuote ?? 0) + price * Math.random() * 5,
        change24h,
        updatedAt: tNow,
        history: ensureHistory(last?.history ?? [], { time: tNow, price }),
      }
      updated[sym] = coin
    }
    set((s) => ({ coins: { ...s.coins, ...updated } }))
  }
  // @ts-ignore - setInterval in browser
  mockTimer = window.setInterval(tick, 1100)
}

export const useMarketStore = create<MarketState>((set, get) => ({
  symbols: DEFAULT_SYMBOLS,
  coins: {},
  isConnected: false,
  useMock: false,

  setSymbols: (symbols: string[]) => {
    const prev = get().symbols
    set({ symbols })
    if (symbols.join(',') !== prev.join(',')) {
      // reconnect with new symbols
      get().disconnect()
      get().connect(symbols)
    }
  },

  connect: (symbols?: string[]) => {
    const syms = (symbols && symbols.length ? symbols : get().symbols).map((s) => s.toLowerCase())
    // Close previous
    if (ws) { try { ws.close() } catch {} ws = null }
    if (mockTimer !== null) { window.clearInterval(mockTimer); mockTimer = null }

    const url = `wss://stream.binance.com:9443/stream?streams=${syms.map((s) => `${s}@miniTicker`).join('/')}`
    try {
      ws = new WebSocket(url)
    } catch (e) {
      // fallback to mock
      set({ isConnected: false, error: 'WebSocket failed, switching to mock', useMock: true })
      startMockFeed(get, set)
      return
    }

    let connected = false
    const fallback = window.setTimeout(() => {
      if (!connected) {
        try { ws?.close() } catch {}
        ws = null
        set({ isConnected: false, error: 'WS timeout, switching to mock', useMock: true })
        startMockFeed(get, set)
      }
    }, 2500)

    ws.onopen = () => {
      connected = true
      window.clearTimeout(fallback)
      set({ isConnected: true, error: undefined, useMock: false })
    }

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string)
        const d = (msg.data ?? msg) as { s: string; c: string; o: string; h: string; l: string; v: string; q: string; E?: number }
        if (!d || !d.s) return
        const symbol = d.s
        const price = Number(d.c)
        const open24h = Number(d.o)
        const high24h = Number(d.h)
        const low24h = Number(d.l)
        const volumeBase = Number(d.v)
        const volumeQuote = Number(d.q)
        const t = (msg.data?.E ?? msg.E ?? Date.now()) as number
        const prev = get().coins[symbol]
        const change24h = open24h > 0 ? (price - open24h) / open24h : 0
        const coin: Coin = {
          symbol,
          price,
          open24h,
          high24h,
          low24h,
          volumeBase,
          volumeQuote,
          change24h,
          updatedAt: t,
          history: ensureHistory(prev?.history ?? [], { time: t, price }),
        }
        set((s) => ({ coins: { ...s.coins, [symbol]: coin } }))
      } catch (e) {
        // ignore
      }
    }

    ws.onerror = () => {
      set({ error: 'WebSocket error' })
    }
    ws.onclose = () => {
      set({ isConnected: false })
    }
  },

  disconnect: () => {
    if (ws) { try { ws.close() } catch {} ws = null }
    if (mockTimer !== null) { window.clearInterval(mockTimer); mockTimer = null }
    set({ isConnected: false })
  },
}))
