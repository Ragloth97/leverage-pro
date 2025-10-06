import { useMemo } from 'react'
import { useMarketStore } from '../stores/marketStore'
import { formatChangePct, formatPrice } from '../utils/format'

export function HeaderTicker() {
  const symbols = useMarketStore((s) => s.symbols)
  const coins = useMarketStore((s) => s.coins)

  const top = useMemo(() => {
    const items = symbols
      .map((sym) => coins[sym])
      .filter(Boolean)
      .slice(0, 12)
    return items
  }, [symbols, coins])

  return (
    <div className="ticker">
      {top.map((coin) => (
        <div className="ticker-item" key={coin.symbol}>
          <span className="muted">{coin.symbol}</span>
          <span className="space-x-8" style={{ marginLeft: 8 }}>
            <span>{formatPrice(coin.price)}</span>
            <span className={coin.change24h >= 0 ? 'up' : 'down'}>{formatChangePct(coin.change24h)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
