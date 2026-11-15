interface StatsStripProps {
  itens: { rotulo: string; valor: string }[]
  cols?: 3 | 4
  className?: string
}

export function StatsStrip({ itens, cols = 4, className = '' }: StatsStripProps) {
  const colunas = cols === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'

  return (
    <dl
      className={`grid gap-px overflow-hidden rounded-xl border border-line bg-line ${colunas} ${className}`}
    >
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className="flex items-baseline justify-between gap-3 bg-ink-2/90 px-4 py-2.5"
        >
          <dt className="text-xs text-muted">{item.rotulo}</dt>
          <dd className="font-display text-lg font-semibold tabular-nums">{item.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
