import type { Status } from '../types'

const CORES: Record<Status, string> = {
  Jogando: 'bg-blue',
  Zerado: 'bg-green',
  Abandonado: 'bg-rose',
  'Quero Jogar': 'bg-violet',
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-paper/80 ${className}`}
    >
      <span className={`size-1.5 rounded-full ${CORES[status]}`} aria-hidden="true" />
      {status}
    </span>
  )
}
