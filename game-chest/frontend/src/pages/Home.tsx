import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { listarReviews, mensagemDeErro } from '../lib/api'
import { formatarData, formatarHoras, formatarNumero, mediaDasNotas, numeroRegistro } from '../lib/format'
import { STATUSES } from '../types'
import type { Review, Status } from '../types'
import { useTitulo } from '../hooks/useTitulo'
import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ReviewRow } from '../components/ReviewRow'
import { StarRating } from '../components/StarRating'
import { StatusBadge } from '../components/StatusBadge'
import { SteamStoreLink } from '../components/SteamStoreLink'

type Ordem = 'created_at' | 'nota'

const filtros: { valor: Status | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todos' },
  ...STATUSES.map((status) => ({ valor: status, rotulo: status })),
]

function Destaque({ review }: { review: Review }) {
  const [expandida, setExpandida] = useState(false)

  useEffect(() => {
    setExpandida(false)
  }, [review.id])

  return (
    <article className="panel reveal-late mt-6 grid overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative border-b border-line lg:border-b-0 lg:border-r">
        <Cover
          src={review.capa_url}
          titulo={review.titulo}
          className="aspect-[460/215] w-full lg:aspect-auto lg:h-full lg:min-h-88"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[0.7rem] font-medium tabular-nums text-paper/80 backdrop-blur">
          Registro {numeroRegistro(review.id)}
        </span>
      </div>

      <div className="flex flex-col p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">{formatarData(review.created_at)}</span>
          <StatusBadge status={review.status} />
        </div>

        <h2 className="mt-2 text-3xl font-extrabold leading-[1.05] sm:text-4xl">
          {review.titulo}
        </h2>

        <div className="mt-2">
          <SteamStoreLink appid={review.steam_appid} />
        </div>

        <div className="mt-2.5 flex items-center gap-3">
          <StarRating value={review.nota} readOnly />
          <span className="text-sm text-muted">
            {review.nota}/5 · {formatarHoras(review.horas_jogadas)}
          </span>
        </div>

        <p
          className={`mt-4 text-sm leading-relaxed text-paper/75 ${
            expandida ? '' : 'line-clamp-5'
          }`}
        >
          {review.texto_review}
        </p>

        <button
          type="button"
          className="btn-quiet mt-2 self-start"
          onClick={() => setExpandida((atual) => !atual)}
          aria-expanded={expandida}
        >
          {expandida ? 'Mostrar menos' : 'Ler review completa'}
        </button>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
           <span>
             por{' '}
             {review.usuario_id ? (
               <Link
                 to={`/usuarios/${review.usuario_id}`}
                 className="font-medium text-paper/80 underline decoration-line/70 underline-offset-4 transition-colors hover:text-amber"
               >
                 {review.usuario}
               </Link>
             ) : (
               <strong className="font-medium text-paper/80">{review.usuario}</strong>
             )}
           </span>
          <span className="hidden tabular-nums sm:inline">
            {formatarNumero(review.horas_jogadas)} horas registradas
          </span>
        </div>
      </div>
    </article>
  )
}

export function Home() {
  useTitulo('Game Chest')

  const [reviews, setReviews] = useState<Review[]>([])
  const [filtro, setFiltro] = useState<Status | ''>('')
  const [ordem, setOrdem] = useState<Ordem>('created_at')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')

    listarReviews({
      status: filtro || undefined,
      ordem,
      direcao: 'desc',
    })
      .then((dados) => {
        if (ativo) setReviews(dados)
      })
      .catch((falha) => {
        if (ativo) setErro(mensagemDeErro(falha))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [filtro, ordem, tentativa])

  const destaque = reviews[0]
  const resto = reviews.slice(1)
  const horasSomadas = reviews.reduce((soma, review) => soma + review.horas_jogadas, 0)
  const media = mediaDasNotas(reviews.map((review) => review.nota))

  return (
    <>
      <section className="reveal">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
          O que a comunidade está jogando
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
          Reviews, horas e notas de quem terminou — ou largou — o jogo. Registre o seu e acompanhe o
          diário dos outros.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm text-muted">
        <span className="flex items-baseline gap-1.5">
          <strong className="font-display text-2xl font-semibold tabular-nums text-paper">
            {reviews.length}
          </strong>
          {reviews.length === 1 ? 'review no arquivo' : 'reviews no arquivo'}
        </span>
        <span aria-hidden="true" className="hidden size-1 rounded-full bg-line sm:block" />
        <span className="flex items-baseline gap-1.5">
          <strong className="font-display text-2xl font-semibold tabular-nums text-paper">
            {formatarNumero(horasSomadas)}
          </strong>
          horas registradas
        </span>
        <span aria-hidden="true" className="hidden size-1 rounded-full bg-line sm:block" />
        <span className="flex items-baseline gap-1.5">
          média
          <strong className="font-display text-2xl font-semibold tabular-nums text-paper">
            {media}
          </strong>
        </span>
      </div>

      {(reviews.length > 0 || filtro !== '') && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-line py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {filtros.map((opcao) => (
              <button
                key={opcao.rotulo}
                type="button"
                className={`chip ${filtro === opcao.valor ? 'chip-active' : ''}`}
                aria-pressed={filtro === opcao.valor}
                onClick={() => setFiltro(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
            <label htmlFor="ordenar" className="text-xs text-muted">
              Ordenar
            </label>
            <select
              id="ordenar"
              value={ordem}
              onChange={(evento) => setOrdem(evento.target.value as Ordem)}
              className="rounded-lg border border-line bg-ink-2 px-2.5 py-1.5 text-sm text-paper"
            >
              <option value="created_at">Mais recentes</option>
              <option value="nota">Melhor nota</option>
            </select>
          </div>
        </div>
      )}

      {erro && (
        <div className="mt-6">
          <ErrorBanner mensagem={erro} onTentarDeNovo={() => setTentativa((n) => n + 1)} />
        </div>
      )}

      {carregando && reviews.length === 0 && <LoadingSpinner label="Abrindo o diário…" />}

      {!carregando && !erro && reviews.length === 0 && (
        <div className="mt-6">
          {filtro ? (
            <EmptyState
              titulo="Nada com esse status ainda"
              descricao="Nenhuma review com esse status no momento. Limpe o filtro para ver o feed inteiro."
              acao={
                <button type="button" className="btn-ghost" onClick={() => setFiltro('')}>
                  Limpar filtro
                </button>
              }
            />
          ) : (
            <EmptyState
              titulo="O diário está em branco"
              descricao="Nenhuma review publicada ainda. Escolha um jogo da Steam e escreva a primeira."
              acao={
                <Link to="/nova-review" className="btn-primary">
                  Avaliar o primeiro jogo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
          )}
        </div>
      )}

      {destaque && (
        <>
          <Destaque review={destaque} />

          {resto.length > 0 && (
            <section className="mt-10" aria-labelledby="mais-recentes">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="mais-recentes" className="text-xl font-bold">
                  Mais no diário
                </h2>
                <span className="text-xs tabular-nums text-muted">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
              <ol className="mt-1 divide-y divide-line">
                {resto.map((review) => (
                  <li key={review.id}>
                    <ReviewRow review={review} />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </>
  )
}
