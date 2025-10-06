import { useEffect, useRef } from 'react'
import { createChart, ColorType, LineSeries } from 'lightweight-charts'
import { useMarketStore } from '../stores/marketStore'
import { compactNumber, formatChangePct, formatPrice, timeAgo } from '../utils/format'

export function CoinModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const coin = useMarketStore((s) => s.coins[symbol])
  const ref = useRef<HTMLDivElement | null>(null)
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 260,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#e5e7eb' },
      grid: { vertLines: { color: 'rgba(36,48,64,0.3)' }, horzLines: { color: 'rgba(36,48,64,0.3)' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })
    chartRef.current = chart
    const series = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 2 })
    seriesRef.current = series
    const handle = () => {
      if (!ref.current || !chartRef.current) return
      chartRef.current.applyOptions({ width: ref.current.clientWidth })
    }
    const ro = new ResizeObserver(handle)
    ro.observe(ref.current)
    return () => { ro.disconnect(); chart.remove() }
  }, [])

  useEffect(() => {
    if (!coin || !seriesRef.current) return
    const data = coin.history.map((p) => ({ time: (p.time / 1000) as any, value: p.price }))
    seriesRef.current.setData(data)
    seriesRef.current.applyOptions({ priceLineVisible: true })
  }, [coin])

  if (!coin) return null

  return (
    <div className="modal-content">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="card modal-card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row space-x-12">
            <div style={{ fontWeight: 700 }}>{coin.symbol}</div>
            <div className="muted">updated {timeAgo(coin.updatedAt)} ago</div>
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="card-body">
            <div className="row space-x-12" style={{ flexWrap: 'wrap' }}>
              <div className="pill">Price {formatPrice(coin.price)}</div>
              <div className={`pill ${coin.change24h>=0?'buy':'sell'}`}>24h {formatChangePct(coin.change24h)}</div>
              <div className="pill">High {formatPrice(coin.high24h)}</div>
              <div className="pill">Low {formatPrice(coin.low24h)}</div>
              <div className="pill">Vol {compactNumber(coin.volumeQuote)}</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div ref={ref} />
          </div>
        </div>
      </div>
    </div>
  )
}
