import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Check,
  ExternalLink,
  Library,
  Link2,
  Link2Off,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  bibliotecaSteam,
  excluirReview,
  listarReviews,
  mensagemDeErro,
  urlVincularSteam,
} from '../lib/api'
import { formatarData, formatarHoras, formatarNumero, mediaDasNotas } from '../lib/format'
import { useTitulo } from '../hooks/useTitulo'
import { useAuth } from '../context/AuthContext'
import type { BibliotecaSteam, Review } from '../types'
import { ConfirmModal } from '../components/ConfirmModal'
import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { StarRating } from '../components/StarRating'
import { StatsStrip } from '../components/StatsStrip'
import { StatusBadge } from '../components/StatusBadge'
import { SteamStoreLink } from '../components/SteamStoreLink'

const PASSO_BIBLIOTECA = 16

function Avatar({ nome, url, tamanho = 'md' }: { nome: string; url: string | null; tamanho?: 'md' | 'lg' }) {
  const classe = tamanho === 'lg' ? 'size-14 text-lg' : 'size-9 text-sm'

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${classe} shrink-0 rounded-full border border-line object-cover`}
      />
    )
  }

  return (
    <span
      className={`${classe} grid shrink-0 place-items-center rounded-full border border-line bg-surface-2 font-display font-bold text-paper/80`}
      aria-hidden="true"
    >
      {nome.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

export function Profile() {
  useTitulo('Meu diário — Game Chest')

  const { usuario, sair, atualizarPerfil, desvincularSteam, recarregar } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [erroPerfil, setErroPerfil] = useState('')
  const [avisoPerfil, setAvisoPerfil] = useState('')

  const [reviews, setReviews] = useState<Review[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [recarregarReviews, setRecarregarReviews] = useState(0)

  const [paraExcluir, setParaExcluir] = useState<Review | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [biblioteca, setBiblioteca] = useState<BibliotecaSteam | null>(null)
  const [carregandoSteam, setCarregandoSteam] = useState(false)
  const [erroSteam, setErroSteam] = useState('')
  const [visiveis, setVisiveis] = useState(PASSO_BIBLIOTECA)
  const [confirmarDesvincular, setConfirmarDesvincular] = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)

  const [aviso, setAviso] = useState('')

  useEffect(() => {
    setNome(usuario?.nome ?? '')
  }, [usuario?.nome])

  // Mensagens vindas do retorno do OpenID da Steam (?steam=ok|erro).
  useEffect(() => {
    const status = searchParams.get('steam')
    if (!status) return

    if (status === 'ok') {
      setAviso('Conta Steam vinculada! Agora dá para puxar as horas da sua biblioteca.')
      void recarregar()
    } else {
      setAviso(
        searchParams.get('motivo') || 'Não foi possível vincular a conta Steam. Tente de novo.',
      )
    }

    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, recarregar])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')

    listarReviews({ meus: true })
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
  }, [recarregarReviews])

  const carregarBiblioteca = useCallback(async () => {
    if (!usuario?.steam_id) return

    setCarregandoSteam(true)
    setErroSteam('')

    try {
      const dados = await bibliotecaSteam()
      setBiblioteca(dados)
      setVisiveis(PASSO_BIBLIOTECA)
    } catch (falha) {
      setErroSteam(mensagemDeErro(falha))
    } finally {
      setCarregandoSteam(false)
    }
  }, [usuario?.steam_id])

  useEffect(() => {
    if (!usuario?.steam_id) {
      setBiblioteca(null)
      setErroSteam('')
      return
    }
    void carregarBiblioteca()
  }, [usuario?.steam_id, carregarBiblioteca])

  const zerados = reviews.filter((review) => review.status === 'Zerado').length
  const horasSomadas = reviews.reduce((soma, review) => soma + review.horas_jogadas, 0)
  const media = mediaDasNotas(reviews.map((review) => review.nota))

  async function salvarPerfil(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const nomeLimpo = nome.trim()
    if (nomeLimpo.length < 2) {
      setErroPerfil('Informe um nome com pelo menos 2 caracteres.')
      return
    }

    setErroPerfil('')
    setSalvandoPerfil(true)

    try {
      await atualizarPerfil(nomeLimpo)
      setAvisoPerfil('Perfil salvo.')
      setRecarregarReviews((n) => n + 1)
    } catch (falha) {
      setErroPerfil(mensagemDeErro(falha))
    } finally {
      setSalvandoPerfil(false)
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return

    setExcluindo(true)
    try {
      await excluirReview(paraExcluir.id)
      setParaExcluir(null)
      setAviso('Review excluída.')
      setRecarregarReviews((n) => n + 1)
    } catch (falha) {
      setParaExcluir(null)
      setErro(mensagemDeErro(falha))
    } finally {
      setExcluindo(false)
    }
  }

  async function confirmarDesvinculo() {
    setDesvinculando(true)
    try {
      await desvincularSteam()
      setBiblioteca(null)
      setConfirmarDesvincular(false)
      setAviso('Conta Steam desvinculada.')
    } catch (falha) {
      setConfirmarDesvincular(false)
      setErroSteam(mensagemDeErro(falha))
    } finally {
      setDesvinculando(false)
    }
  }

  if (!usuario) {
    return <LoadingSpinner label="Carregando seu perfil…" />
  }

  const jogosVisiveis = biblioteca?.jogos.slice(0, visiveis) ?? []

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Meu diário</h1>
          <p className="mt-2 max-w-xl text-muted">
            Sua conta, sua biblioteca Steam e as reviews que você publicou.
          </p>
        </div>

        <button type="button" className="btn-ghost" onClick={() => void sair()}>
          <LogOut className="size-4" aria-hidden="true" />
          Sair da conta
        </button>
      </div>

      {aviso && (
        <div
          role="status"
          className="mt-5 flex items-center gap-3 rounded-xl border border-green/40 bg-green/10 px-4 py-3 text-sm"
        >
          <Check className="size-4 shrink-0 text-green" aria-hidden="true" />
          <p className="flex-1">{aviso}</p>
          <button type="button" className="btn-quiet" onClick={() => setAviso('')}>
            Fechar
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Conta ---------------------------------------------------- */}
        <section className="panel p-5 sm:p-6" aria-labelledby="conta-titulo">
          <div className="flex items-center gap-3">
            <Avatar nome={usuario.nome} url={usuario.avatar_url} tamanho="lg" />
            <div className="min-w-0">
              <h2 id="conta-titulo" className="text-xl font-bold">
                Sua conta
              </h2>
              <p className="truncate text-sm text-muted">{usuario.email}</p>
            </div>
          </div>

          <form onSubmit={salvarPerfil} className="mt-5">
            <label htmlFor="perfil-nome" className="field-label">
              Nome no feed
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="perfil-nome"
                className="field min-w-0 flex-1"
                value={nome}
                onChange={(evento) => {
                  setNome(evento.target.value)
                  setAvisoPerfil('')
                }}
                placeholder="PlayerOne"
                maxLength={100}
              />
              <button type="submit" className="btn-primary" disabled={salvandoPerfil}>
                {salvandoPerfil ? 'Salvando…' : 'Salvar'}
              </button>
            </div>

            {erroPerfil && <p className="mt-2 text-sm text-rose">{erroPerfil}</p>}
            {avisoPerfil && (
              <p className="mt-2 text-sm text-green" role="status">
                {avisoPerfil}
              </p>
            )}
          </form>

          <p className="mt-3 text-xs text-muted">
            O nome aparece nas suas reviews e no feed da comunidade.
          </p>
        </section>

        {/* Steam ---------------------------------------------------- */}
        <section className="panel p-5 sm:p-6" aria-labelledby="steam-titulo">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="steam-titulo" className="flex items-center gap-2 text-xl font-bold">
                <Link2 className="size-5 text-blue" aria-hidden="true" />
                Conta Steam
              </h2>
              <p className="mt-1 text-sm text-muted">
                Opcional. Vinculando, as horas de cada jogo vêm da sua biblioteca — jogos com 0h
                ficam de fora.
              </p>
            </div>
          </div>

          {usuario.steam_id ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-2/60 p-3">
                <Avatar nome={usuario.steam_nome ?? usuario.nome} url={usuario.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {usuario.steam_nome ?? 'Conta Steam vinculada'}
                  </p>
                  <p className="truncate text-xs tabular-nums text-muted">
                    SteamID {usuario.steam_id}
                  </p>
                </div>
                <a
                  href={`https://steamcommunity.com/profiles/${usuario.steam_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-quiet shrink-0"
                >
                  Abrir
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => void carregarBiblioteca()}
                  disabled={carregandoSteam}
                >
                  <RefreshCw
                    className={`size-4 ${carregandoSteam ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {carregandoSteam ? 'Atualizando…' : 'Atualizar biblioteca'}
                </button>
                <button
                  type="button"
                  className="btn-ghost text-rose hover:border-rose"
                  onClick={() => setConfirmarDesvincular(true)}
                >
                  <Link2Off className="size-4" aria-hidden="true" />
                  Desvincular
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted">
                Sua conta Steam não está vinculada. A busca de jogos continua funcionando normalmente
                sem ela.
              </p>
              <a href={urlVincularSteam()} className="btn-primary">
                <Link2 className="size-4" aria-hidden="true" />
                Vincular conta Steam
              </a>
              <p className="text-xs text-muted">
                Você será levado à Steam para autorizar e volta para cá. É preciso ter os “Detalhes do
                jogo” públicos no perfil.
              </p>
            </div>
          )}

          {erroSteam && <p className="mt-3 text-sm text-rose">{erroSteam}</p>}
        </section>
      </div>

      {/* Biblioteca ------------------------------------------------ */}
      <section className="mt-6" aria-labelledby="biblioteca-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="biblioteca-titulo" className="flex items-center gap-2 text-2xl font-bold">
            <Library className="size-5 text-muted" aria-hidden="true" />
            Biblioteca Steam
          </h2>
          {biblioteca && (
            <p className="text-sm text-muted">
              <strong className="font-display text-xl tabular-nums text-paper">
                {formatarNumero(biblioteca.total_jogos)}
              </strong>{' '}
              jogos com horas ·{' '}
              <strong className="font-display text-xl tabular-nums text-paper">
                {formatarNumero(biblioteca.total_horas)}
              </strong>{' '}
              horas no total
            </p>
          )}
        </div>

        {!usuario.steam_id && (
          <p className="mt-3 text-sm text-muted">
            Vincule a Steam acima para carregar seus jogos e as horas jogadas.
          </p>
        )}

        {usuario.steam_id && carregandoSteam && !biblioteca && (
          <LoadingSpinner label="Lendo sua biblioteca na Steam…" />
        )}

        {usuario.steam_id && !carregandoSteam && !erroSteam && biblioteca && jogosVisiveis.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            Nenhum jogo com horas jogadas foi encontrado. Confira se os “Detalhes do jogo” estão
            públicos no seu perfil da Steam.
          </p>
        )}

        {jogosVisiveis.length > 0 && (
          <>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {jogosVisiveis.map((jogo) => (
                <li
                  key={jogo.steam_appid}
                  className="flex items-center gap-3 rounded-lg border border-line bg-ink-2/60 p-2"
                >
                  <Cover
                    src={jogo.capa_url}
                    titulo={jogo.titulo}
                    className="h-10 w-16 shrink-0 rounded border border-line"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{jogo.titulo}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatarHoras(jogo.horas_jogadas)}
                  </span>
                  <Link
                    to="/nova-review"
                    state={{ jogoSteam: jogo }}
                    className="btn-ghost shrink-0 px-2.5 py-1.5 text-xs"
                    aria-label={`Adicionar review de ${jogo.titulo}`}
                    title="Adicionar review"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Adicionar review</span>
                  </Link>
                </li>
              ))}
            </ul>

            {biblioteca && biblioteca.jogos.length > jogosVisiveis.length && (
              <button
                type="button"
                className="btn-ghost mt-3"
                onClick={() => setVisiveis((n) => n + PASSO_BIBLIOTECA)}
              >
                Ver mais {Math.min(PASSO_BIBLIOTECA, biblioteca.jogos.length - jogosVisiveis.length)}{' '}
                jogos
              </button>
            )}
          </>
        )}
      </section>

      {/* Reviews ---------------------------------------------------- */}
      <StatsStrip
        className="mt-8"
        itens={[
          { rotulo: 'Reviews', valor: String(reviews.length) },
          { rotulo: 'Zerados', valor: String(zerados) },
          { rotulo: 'Horas', valor: formatarNumero(horasSomadas) },
          { rotulo: 'Média', valor: media },
        ]}
      />

      <section className="mt-8" aria-labelledby="suas-reviews">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2 id="suas-reviews" className="text-2xl font-bold">
              Suas reviews
            </h2>
            <span className="text-xs tabular-nums text-muted">{reviews.length}</span>
          </div>
          <Link to="/nova-review" className="btn-primary">
            <Plus className="size-4" aria-hidden="true" />
            Avaliar jogo
          </Link>
        </div>

        {carregando && <LoadingSpinner label="Carregando seu diário…" />}

        {erro && (
          <div className="mt-4">
            <ErrorBanner mensagem={erro} onTentarDeNovo={() => setRecarregarReviews((n) => n + 1)} />
          </div>
        )}

        {!carregando && !erro && reviews.length === 0 && (
          <div className="mt-4">
            <EmptyState
              titulo="Nenhuma review sua ainda"
              descricao="Escolha um jogo da Steam, dê sua nota e comece a preencher o diário."
              acao={
                <Link to="/nova-review" className="btn-primary">
                  Avaliar um jogo
                </Link>
              }
            />
          </div>
        )}

        {!carregando && reviews.length > 0 && (
          <ol className="mt-1 divide-y divide-line">
            {reviews.map((review) => (
              <li key={review.id}>
                <article className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-start sm:gap-4">
                  <Cover
                    src={review.capa_url}
                    titulo={review.titulo}
                    className="aspect-[460/215] w-full self-start rounded-lg border border-line"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted">
                      <StatusBadge status={review.status} className="shrink-0" />
                      <span className="whitespace-nowrap">{formatarData(review.created_at)}</span>
                      <span className="whitespace-nowrap">{formatarHoras(review.horas_jogadas)}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold leading-snug">{review.titulo}</h3>
                    <div className="mt-1">
                      <SteamStoreLink appid={review.steam_appid} compacto />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating value={review.nota} readOnly size="sm" />
                      <span className="text-xs tabular-nums text-muted">{review.nota}/5</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                      {review.texto_review}
                    </p>
                  </div>

                  <div className="col-span-2 flex justify-end gap-1.5 sm:col-span-1 sm:justify-start">
                    <Link
                      to={`/editar-review/${review.id}`}
                      className="grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-muted hover:text-paper"
                      aria-label={`Editar review de ${review.titulo}`}
                      title="Editar"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setParaExcluir(review)}
                      className="grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-rose hover:text-rose"
                      aria-label={`Excluir review de ${review.titulo}`}
                      title="Excluir"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ConfirmModal
        aberto={Boolean(paraExcluir)}
        titulo="Excluir esta review?"
        mensagem={
          paraExcluir
            ? `"${paraExcluir.titulo}" vai sair do feed e do seu diário. Não dá para desfazer.`
            : ''
        }
        ocupado={excluindo}
        onCancelar={() => setParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />

      <ConfirmModal
        aberto={confirmarDesvincular}
        titulo="Desvincular a conta Steam?"
        mensagem="As hours já registradas nas reviews continuam salvas. Você pode vincular de novo quando quiser."
        ocupado={desvinculando}
        rotuloConfirmar="Desvincular"
        onCancelar={() => setConfirmarDesvincular(false)}
        onConfirmar={confirmarDesvinculo}
      />
    </>
  )
}
