import type { Status, SteamGame } from '../types'
import { Cover } from './Cover'
import { StarRating } from './StarRating'
import { StatusBadge } from './StatusBadge'

interface ReviewPreviewProps {
  jogo: SteamGame | null
  nota: number
  status: Status
  horas: number
  usuario: string
  texto: string
}

export function ReviewPreview({ jogo, nota, status, horas, usuario, texto }: ReviewPreviewProps) {
  return (
    <aside className="panel overflow-hidden" aria-label="Prévia da review">
      <div className="aspect-[460/215] border-b border-line bg-surface-2">
        {jogo ? (
          <Cover src={jogo.capa_url} titulo={jogo.titulo} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
            Escolha um jogo para ver a prévia
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Prévia</span>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-1 text-2xl font-bold leading-tight">
          {jogo?.titulo ?? 'Seu próximo jogo'}
        </h3>
        <div className="mt-2 flex items-center gap-2.5">
          <StarRating value={nota} readOnly size="sm" />
          <span className="text-xs text-muted">{horas > 0 ? `${horas}h` : '0h'}</span>
        </div>
        <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-muted">
          {texto.trim() || 'Sua análise aparece aqui enquanto você escreve.'}
        </p>
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          por <span className="text-paper/80">{usuario || 'você'}</span>
        </p>
      </div>
    </aside>
  )
}
