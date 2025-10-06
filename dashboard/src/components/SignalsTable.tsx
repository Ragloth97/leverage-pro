import { useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { useMarketStore } from '../stores/marketStore'
import type { Coin } from '../stores/marketStore'
import { CoinModal } from './CoinModal'
import { compactNumber, formatChangePct, formatPrice } from '../utils/format'

type Row = {
  symbol: string
  price: number
  change24h: number
  volumeQuote: number
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

const columnHelper = createColumnHelper<Row>()

export function SignalsTable() {
  const coins = useMarketStore((s) => s.coins)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'volumeQuote', desc: true }])
  const [query, setQuery] = useState('')
  const [onlyStrong, setOnlyStrong] = useState(false)
  const [modal, setModal] = useState<string | null>(null)

  const data = useMemo<Row[]>(() => {
    const rows: Row[] = Object.values(coins).map((c: Coin) => {
      const momentum = (c.price - (c.history[c.history.length - 20]?.price ?? c.price)) / c.price
      const signal: Row['signal'] = momentum > 0.01 && c.change24h > 0 ? 'BUY' : momentum < -0.01 && c.change24h < 0 ? 'SELL' : 'NEUTRAL'
      return {
        symbol: c.symbol,
        price: c.price,
        change24h: c.change24h,
        volumeQuote: c.volumeQuote,
        signal,
      }
    })
    const filtered = rows.filter((r) => r.symbol.toLowerCase().includes(query.toLowerCase()))
    return onlyStrong ? filtered.filter((r) => r.signal !== 'NEUTRAL') : filtered
  }, [coins, query, onlyStrong])

  const columns = useMemo(() => [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: (info) => <span style={{ fontWeight: 600 }}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: (info) => <span>{formatPrice(info.getValue())}</span>,
    }),
    columnHelper.accessor('change24h', {
      header: '24h %',
      cell: (info) => <span className={info.getValue() >= 0 ? 'up' : 'down'}>{formatChangePct(info.getValue())}</span>,
    }),
    columnHelper.accessor('volumeQuote', {
      header: 'Volume (Quote)',
      cell: (info) => <span>{compactNumber(info.getValue())}</span>,
    }),
    columnHelper.accessor('signal', {
      header: 'Signal',
      cell: (info) => (
        <span className={`pill ${info.getValue() === 'BUY' ? 'buy' : info.getValue() === 'SELL' ? 'sell' : 'neutral'}`}>
          {info.getValue()}
        </span>
      ),
    }),
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-12">
      <div className="row space-x-12">
        <input className="input" placeholder="Search symbol..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="row space-x-8" style={{ fontSize: 14 }}>
          <input type="checkbox" checked={onlyStrong} onChange={(e) => setOnlyStrong(e.target.checked)} />
          <span>Only BUY/SELL</span>
        </label>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} onClick={h.column.getToggleSortingHandler()} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}>
                    <div className="row space-x-8">
                      <span>{flexRender(h.column.columnDef.header, h.getContext())}</span>
                      {{ asc: '▲', desc: '▼' }[h.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => setModal(row.original.symbol)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <CoinModal symbol={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
