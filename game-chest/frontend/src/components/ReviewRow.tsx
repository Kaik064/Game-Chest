import type { Review } from '../types'
import { Link } from 'react-router-dom'
import { formatarData, formatarHoras, numeroRegistro } from '../lib/format'
import { Cover } from './Cover'
import { StarRating } from './StarRating'
import { StatusBadge } from './StatusBadge'
import { SteamStoreLink } from './SteamStoreLink'

interface ReviewRowProps {
  review: Review
}

export function ReviewRow({ review }: ReviewRowProps) {
  return (
    <article className="grid grid-cols-[6.5rem_1fr] gap-4 py-5 sm:grid-cols-[4.5rem_9.5rem_1fr] sm:gap-5">
      <span
        className="hidden select-none pt-0.5 font-display text-sm font-semibold tabular-nums text-muted/60 sm:block"
        aria-hidden="true"
      >
        {numeroRegistro(review.id)}
      </span>

      <Cover
        src={review.capa_url}
        titulo={review.titulo}
        className="aspect-[460/215] w-full self-start rounded-lg border border-line"
      />

      <div className="min-w-0">
        <h3 className="text-base font-bold leading-snug sm:text-xl">{review.titulo}</h3>

        <div className="mt-1">
          <SteamStoreLink appid={review.steam_appid} compacto />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
          <StatusBadge status={review.status} className="shrink-0" />
          <span className="whitespace-nowrap">{formatarData(review.created_at)}</span>
          <span className="whitespace-nowrap">
             {formatarHoras(review.horas_jogadas)} ·{' '}
             {review.usuario_id ? (
               <Link
                 to={`/usuarios/${review.usuario_id}`}
                 className="underline decoration-line/70 underline-offset-4 transition-colors hover:text-amber"
               >
                 {review.usuario}
               </Link>
             ) : (
               review.usuario
             )}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{review.texto_review}</p>

        <div className="mt-2 flex items-center gap-2">
          <StarRating value={review.nota} readOnly size="sm" />
          <span className="text-xs tabular-nums text-muted">{review.nota}/5</span>
        </div>
      </div>
    </article>
  )
}
