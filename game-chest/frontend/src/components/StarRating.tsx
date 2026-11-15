import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (valor: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const tamanhos = {
  sm: 'size-3.5',
  md: 'size-[18px]',
  lg: 'size-6',
}

export function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const classeEstrela = tamanhos[size]

  if (readOnly) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        aria-label={`Nota ${value} de 5`}
        title={`Nota ${value} de 5`}
      >
        {[1, 2, 3, 4, 5].map((estrela) => (
          <Star
            key={estrela}
            aria-hidden="true"
            className={`${classeEstrela} ${
              estrela <= value ? 'fill-amber text-amber' : 'fill-transparent text-line'
            }`}
          />
        ))}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Sua nota">
      {[1, 2, 3, 4, 5].map((estrela) => (
        <button
          key={estrela}
          type="button"
          aria-label={`${estrela} de 5 estrelas`}
          aria-pressed={estrela <= value}
          onClick={() => onChange?.(estrela)}
          className="rounded-md p-0.5 transition-transform hover:scale-110"
        >
          <Star
            aria-hidden="true"
            className={`${classeEstrela} transition-colors ${
              estrela <= value ? 'fill-amber text-amber' : 'fill-transparent text-line hover:text-muted'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
