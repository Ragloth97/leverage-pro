import { useEffect } from 'react'
import { HeaderTicker } from './components/HeaderTicker'
import { SignalsTable } from './components/SignalsTable'
import { MockTradingPanel } from './components/MockTradingPanel'
import { useMarketStore } from './stores/marketStore'

function App() {
  const connect = useMarketStore((s) => s.connect)
  const isConnected = useMarketStore((s) => s.isConnected)

  useEffect(() => {
    connect()
  }, [connect])

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div className="brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12L12 3L21 12L12 21L3 12Z" stroke="url(#g)" strokeWidth="2"/>
              <defs>
                <linearGradient id="g" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22d3ee"/>
                  <stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Crypto Dashboard</span>
            <span className="badge">Binance-style • Dark</span>
          </div>
          <div style={{ flex: 1, minWidth: 120 }} />
          <div className="hidden-sm badge">{isConnected ? 'Live' : 'Connecting...'}</div>
        </div>
        <div className="container" style={{ paddingTop: 0 }}>
          <HeaderTicker />
        </div>
      </header>

      <main className="container" style={{ width: '100%' }}>
        <div className="grid-main">
          <section className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>Trading Signals</div>
              <div className="muted" style={{ fontSize: 12 }}>Interactive • Sort • Filter • Click rows for details</div>
            </div>
            <div className="card-body">
              <SignalsTable />
            </div>
          </section>

          <aside className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>Mock Trading</div>
              <div className="muted" style={{ fontSize: 12 }}>Paper trade with local data</div>
            </div>
            <div className="card-body">
              <MockTradingPanel />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App
