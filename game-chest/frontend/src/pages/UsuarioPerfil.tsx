import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { buscarPerfilPublico, mensagemDeErro } from '../lib/api'
import { formatarData, formatarHoras } from '../lib/format'
import { useTitulo } from '../hooks/useTitulo'
import type { Review, UsuarioEncontrado } from '../types'
import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StarRating } from '../components/StarRating'
import { StatusBadge } from '../components/StatusBadge'
import { SteamStoreLink } from '../components/SteamStoreLink'

export function UsuarioPerfil() {
  const { id } = useParams<{ id: string }>()
  const [usuario, setUsuario] = useState<UsuarioEncontrado | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  useTitulo(usuario ? `${usuario.nome} — Game Chest` : 'Perfil — Game Chest')

  useEffect(() => {
    if (!id) return
    let ativo = true
    setCarregando(true)
    buscarPerfilPublico(id)
      .then((dados) => {
        if (!ativo) return
        setUsuario(dados.usuario)
        setReviews(dados.reviews)
      })
      .catch((falha) => { if (ativo) setErro(mensagemDeErro(falha)) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [id])

  if (carregando) return <LoadingSpinner label="Abrindo diário…" />
  if (erro) return <p className="text-rose">{erro}</p>
  if (!usuario) return null

  return (
    <>
      <Link to="/usuarios" className="btn-quiet"><ArrowLeft className="size-4" aria-hidden="true" /> Voltar para explorar</Link>
      <header className="mt-5 flex items-center gap-4">
        {usuario.avatar_url ? <img src={usuario.avatar_url} alt="" className="size-16 rounded-full border border-line object-cover" /> : <span className="grid size-16 place-items-center rounded-full border border-line bg-surface-2 font-display text-2xl font-bold">{usuario.nome.charAt(0).toUpperCase()}</span>}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{usuario.nome}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Users className="size-3.5" aria-hidden="true" /> {usuario.total_reviews} reviews públicas</p>
        </div>
      </header>

      {reviews.length === 0 ? <div className="mt-8"><EmptyState titulo="Este diário ainda está vazio" descricao="Essa pessoa ainda não publicou reviews." /></div> : (
        <ol className="mt-8 divide-y divide-line">
          {reviews.map((review) => (
            <li key={review.id}>
              <article className="grid grid-cols-[6rem_1fr] gap-4 py-5 sm:grid-cols-[10rem_1fr]">
                <Cover src={review.capa_url} titulo={review.titulo} className="aspect-[460/215] w-full self-start rounded-lg border border-line" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><StatusBadge status={review.status} /><span>{formatarData(review.created_at)}</span><span>{formatarHoras(review.horas_jogadas)}</span></div>
                  <h2 className="mt-1 text-xl font-bold">{review.titulo}</h2>
                  <div className="mt-1"><SteamStoreLink appid={review.steam_appid} compacto /></div>
                  <div className="mt-1 flex items-center gap-2"><StarRating value={review.nota} readOnly size="sm" /><span className="text-xs text-muted">{review.nota}/5</span></div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{review.texto_review}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
