import { useMemo, useState } from 'react'
import { useMarketStore } from '../stores/marketStore'
import { compactNumber, formatPrice } from '../utils/format'

export function MockTradingPanel() {
  const coins = useMarketStore((s) => s.coins)
  const symbols = useMarketStore((s) => s.symbols)
  const [symbol, setSymbol] = useState(symbols[0] ?? 'BTCUSDT')
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [size, setSize] = useState(100)
  const [positions, setPositions] = useState<{ symbol: string; qty: number; avg: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('positions') || '[]') } catch { return [] }
  })

  const price = coins[symbol]?.price ?? 0

  const pnl = useMemo(() => {
    return positions.reduce((acc, p) => acc + (price - p.avg) * p.qty, 0)
  }, [positions, price])

  function placeOrder() {
    const qty = size / Math.max(price, 0.0001)
    setPositions((prev) => {
      const next = [...prev]
      const i = next.findIndex((p) => p.symbol === symbol)
      if (i === -1) {
        const signedQty = side === 'BUY' ? qty : -qty
        next.push({ symbol, qty: signedQty, avg: price })
      } else {
        const pos = next[i]
        const signedQty = side === 'BUY' ? qty : -qty
        const newQty = pos.qty + signedQty
        if (Math.abs(newQty) < 1e-9) {
          next.splice(i, 1)
        } else if (Math.sign(newQty) !== Math.sign(pos.qty)) {
          // flipped side, set new avg on remaining
          next[i] = { symbol, qty: newQty, avg: price }
        } else {
          const totalCost = pos.avg * Math.abs(pos.qty) + price * Math.abs(signedQty)
          const totalQty = Math.abs(pos.qty) + Math.abs(signedQty)
          const newAvg = totalCost / Math.max(totalQty, 1e-9)
          next[i] = { symbol, qty: newQty, avg: newAvg }
        }
      }
      localStorage.setItem('positions', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="space-y-12">
      <div className="space-y-12">
        <div className="row space-x-12">
          <select className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={side} onChange={(e) => setSide(e.target.value as any)}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <input className="input" type="number" min={10} step={10} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          <button className="btn primary" onClick={placeOrder}>Place</button>
        </div>
        <div className="row space-x-12" style={{ fontSize: 14 }}>
          <span className="muted">Price</span>
          <span>{formatPrice(price)}</span>
          <span className="muted">Position PnL</span>
          <span className={pnl >= 0 ? 'up' : 'down'}>{pnl >= 0 ? '+' : ''}{formatPrice(pnl)}</span>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header" style={{ fontWeight: 600 }}>Positions</div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg</th>
                <th className="text-right">Value</th>
                <th className="text-right">PnL</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center muted" style={{ padding: 16 }}>No positions</td>
                </tr>
              ) : positions.map((p) => {
                const value = p.qty * price
                const pnl = (price - p.avg) * p.qty
                return (
                  <tr key={p.symbol}>
                    <td>{p.symbol}</td>
                    <td className="text-right">{p.qty.toFixed(6)}</td>
                    <td className="text-right">{formatPrice(p.avg)}</td>
                    <td className="text-right">{compactNumber(Math.abs(value))}</td>
                    <td className={`text-right ${pnl >= 0 ? 'up' : 'down'}`}>{pnl >= 0 ? '+' : ''}{formatPrice(pnl)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
