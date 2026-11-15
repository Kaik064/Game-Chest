import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'

interface CoverProps {
  src: string
  titulo: string
  className?: string
}

export function Cover({ src, titulo, className = '' }: CoverProps) {
  const [falhou, setFalhou] = useState(false)

  if (falhou || !src) {
    return (
      <div
        role="img"
        aria-label={`Capa de ${titulo}`}
        className={`grid place-items-center bg-surface-2 ${className}`}
      >
        <Gamepad2 className="size-6 text-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`Capa de ${titulo}`}
      loading="lazy"
      onError={() => setFalhou(true)}
      className={`object-cover ${className}`}
    />
  )
}
