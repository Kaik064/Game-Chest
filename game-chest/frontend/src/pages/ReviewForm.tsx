import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Save } from 'lucide-react'
import {
  atualizarReview,
  bibliotecaSteam,
  buscarDetalhesJogo,
  buscarReview,
  criarReview,
  mensagemDeErro,
} from '../lib/api'
import { useTitulo } from '../hooks/useTitulo'
import { useAuth } from '../context/AuthContext'
import { STATUSES } from '../types'
import type { BibliotecaSteam, JogoDetalhes, Status, SteamGame, SteamOwnedGame } from '../types'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ReviewPreview } from '../components/ReviewPreview'
import { StarRating } from '../components/StarRating'
import { SteamAutocompleteInput } from '../components/SteamAutocompleteInput'

export function ReviewForm() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()

  const jogoDaBiblioteca = (location.state as { jogoSteam?: SteamOwnedGame } | null)?.jogoSteam

  const [jogo, setJogo] = useState<SteamGame | null>(jogoDaBiblioteca ?? null)
  const [detalhesJogo, setDetalhesJogo] = useState<JogoDetalhes | null>(null)
  const [biblioteca, setBiblioteca] = useState<BibliotecaSteam | null>(null)
  const [horas, setHoras] = useState(String(jogoDaBiblioteca?.horas_jogadas ?? 0))
  const [status, setStatus] = useState<Status>('Jogando')
  const [nota, setNota] = useState(0)
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useTitulo(editando ? 'Editar review — Game Chest' : 'Nova review — Game Chest')

  useEffect(() => {
    if (!id) return

    let ativo = true
    setCarregando(true)
    setErro('')

    buscarReview(id)
      .then((review) => {
        if (!ativo) return
        setJogo({
          steam_appid: review.steam_appid,
          titulo: review.titulo,
          capa_url: review.capa_url,
        })
        setDetalhesJogo(null)
        setHoras(String(review.horas_jogadas))
        setStatus(review.status)
        setNota(review.nota)
        setTexto(review.texto_review)
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
  }, [id])

  // Ao entrar pelo botão da biblioteca, já seleciona o jogo e as horas. O
  // usuário continua livre para alterar horas, status, nota e texto.
  useEffect(() => {
    if (!editando && jogoDaBiblioteca) {
      setJogo(jogoDaBiblioteca)
      setHoras(String(jogoDaBiblioteca.horas_jogadas))
      window.history.replaceState({}, '')
    }
  }, [editando, jogoDaBiblioteca])

  useEffect(() => {
    if (!jogo) {
      setDetalhesJogo(null)
      return
    }
    let ativo = true
    buscarDetalhesJogo(jogo.steam_appid)
      .then((detalhes) => { if (ativo) setDetalhesJogo(detalhes) })
      .catch(() => { if (ativo) setDetalhesJogo(null) })
    return () => { ativo = false }
  }, [jogo])

  useEffect(() => {
    if (!usuario?.steam_id) return
    let ativo = true
    bibliotecaSteam()
      .then((dados) => { if (ativo) setBiblioteca(dados) })
      .catch(() => { if (ativo) setBiblioteca(null) })
    return () => { ativo = false }
  }, [usuario?.steam_id])

  const horasDaBiblioteca = jogo
    ? biblioteca?.jogos.find((item) => item.steam_appid === jogo.steam_appid)?.horas_jogadas
    : undefined

  useEffect(() => {
    if (horasDaBiblioteca !== undefined && !editando) setHoras(String(horasDaBiblioteca))
  }, [horasDaBiblioteca, editando])

  const horasNumero = Math.max(0, Math.floor(Number(horas) || 0))

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!jogo) {
      setErro('Escolha um jogo da Steam para avaliar.')
      return
    }
    if (nota < 1) {
      setErro('Dê uma nota de 1 a 5 estrelas.')
      return
    }
    const textoLimpo = texto.trim()
    if (!textoLimpo) {
      setErro('Escreva pelo menos uma frase sobre o jogo.')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      if (editando && id) {
        await atualizarReview(id, {
          horas_jogadas: horasNumero,
          status,
          nota,
          texto_review: textoLimpo,
        })
        navigate('/perfil', { state: { aviso: 'Review atualizada.' } })
      } else {
        await criarReview({
          steam_appid: jogo.steam_appid,
          titulo: jogo.titulo,
          capa_url: jogo.capa_url,
          horas_jogadas: horasNumero,
          status,
          nota,
          texto_review: textoLimpo,
          data_lancamento: detalhesJogo?.data_lancamento,
          desenvolvedor: detalhesJogo?.desenvolvedor,
          genero: detalhesJogo?.genero,
          avaliacao_steam: detalhesJogo?.avaliacao?.descricao,
          avaliacao_percentual: detalhesJogo?.avaliacao?.percentual,
          avaliacao_total: detalhesJogo?.avaliacao?.total,
        })
        navigate('/perfil', { state: { aviso: 'Review publicada.' } })
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to={editando ? '/perfil' : '/'} className="btn-quiet">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {editando ? 'Voltar ao meu diário' : 'Voltar ao feed'}
      </Link>

      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        {editando ? 'Editar review' : 'Nova review'}
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        {editando
          ? 'Ajuste nota, horas, status ou texto. O jogo escolhido não muda depois de publicado.'
          : 'Escolha o jogo, conte como foi e registre no seu diário.'}
      </p>

      {carregando ? (
        <LoadingSpinner label="Carregando a review…" />
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <form onSubmit={enviar} className="space-y-5">
            {erro && <ErrorBanner mensagem={erro} />}

            <div className="panel space-y-6 p-5 sm:p-6">
              <div>
                <span className="field-label">Jogo</span>
                <SteamAutocompleteInput
                  selecionado={jogo}
                  onSelecionar={setJogo}
                  desabilitado={editando}
                  horasBiblioteca={horasDaBiblioteca}
                />
                {editando && (
                  <p className="mt-2 text-xs text-muted">
                    Para trocar o jogo, exclua esta review e crie outra.
                  </p>
                )}
                {detalhesJogo && (
                  <div className="mt-3 rounded-xl border border-line bg-ink-2/50 p-3 text-xs text-muted">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {detalhesJogo.data_lancamento && <span>Lançamento: {detalhesJogo.data_lancamento}</span>}
                      {detalhesJogo.desenvolvedor && <span>Desenvolvedor: {detalhesJogo.desenvolvedor}</span>}
                      {detalhesJogo.genero && <span>{detalhesJogo.genero}</span>}
                      {detalhesJogo.preco && (
                        <span className="font-semibold text-paper">
                          Preço atual: {detalhesJogo.preco}
                          {detalhesJogo.desconto_percentual > 0 && (
                            <span className="ml-1 text-green">-{detalhesJogo.desconto_percentual}%</span>
                          )}
                        </span>
                      )}
                      {detalhesJogo.avaliacao && (
                        <span className="text-amber">
                          Steam: {detalhesJogo.avaliacao.descricao} ({detalhesJogo.avaliacao.percentual}%)
                        </span>
                      )}
                    </div>
                    <a
                      href={detalhesJogo.url_loja}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-quiet mt-2"
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                      Ver na loja Steam
                    </a>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted">
                  Publicando como <strong className="font-medium text-paper/80">{usuario!.nome}</strong>.{' '}
                  <Link
                    to="/perfil"
                    className="underline decoration-line underline-offset-4 hover:text-paper"
                  >
                    Trocar no perfil
                  </Link>
                </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="horas" className="field-label">
                    Horas jogadas
                  </label>
                  <input
                    id="horas"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    className="field tabular-nums"
                    value={horas}
                    onChange={(evento) => setHoras(evento.target.value)}
                  />
                </div>

                <div>
                  <span className="field-label">Status</span>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Status do jogo">
                    {STATUSES.map((opcao) => (
                      <button
                        key={opcao}
                        type="button"
                        aria-pressed={status === opcao}
                        onClick={() => setStatus(opcao)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          status === opcao
                            ? 'border-amber bg-amber/10 text-paper'
                            : 'border-line text-muted hover:border-muted hover:text-paper'
                        }`}
                      >
                        {opcao}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="field-label">Sua nota</span>
                <div className="flex items-center gap-3">
                  <StarRating value={nota} onChange={setNota} size="lg" />
                  <span className="text-sm text-muted">
                    {nota > 0 ? `${nota} de 5` : 'Escolha de 1 a 5'}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="texto" className="field-label">
                  Sua análise
                </label>
                <textarea
                  id="texto"
                  className="field min-h-40 resize-y leading-relaxed"
                  value={texto}
                  onChange={(evento) => setTexto(evento.target.value)}
                  placeholder="O que funcionou? O que não funcionou? Vale a pena para quem?"
                  maxLength={2000}
                  rows={7}
                  required
                />
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>Fica pública no feed da comunidade.</span>
                  <span className="tabular-nums">{texto.length}/2000</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted">
                {editando
                  ? 'As alterações aparecem no feed assim que você salvar.'
                  : 'Você pode editar ou excluir depois, no seu diário.'}
              </p>
              <button type="submit" className="btn-primary" disabled={salvando}>
                <Save className="size-4" aria-hidden="true" />
                {salvando
                  ? editando
                    ? 'Salvando…'
                    : 'Publicando…'
                  : editando
                    ? 'Salvar alterações'
                    : 'Publicar review'}
              </button>
            </div>
          </form>

          <div className="hidden lg:sticky lg:top-24 lg:block">
            <ReviewPreview
              jogo={jogo}
              nota={nota}
              status={status}
              horas={horasNumero}
               usuario={usuario!.nome}
              texto={texto}
            />
          </div>
        </div>
      )}
    </div>
  )
}
