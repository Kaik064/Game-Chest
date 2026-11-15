import type { ReactNode } from 'react'
import { PackageOpen } from 'lucide-react'

interface EmptyStateProps {
  titulo: string
  descricao: string
  acao?: ReactNode
}

export function EmptyState({ titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface text-amber">
        <PackageOpen className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="max-w-md text-sm text-muted">{descricao}</p>
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  )
}
