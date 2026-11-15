import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ExternalLink, Loader2, Search } from 'lucide-react'
import { buscarJogosSteam, mensagemDeErro } from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'
import type { SteamGame } from '../types'
import { Cover } from './Cover'

interface SteamAutocompleteInputProps {
  selecionado: SteamGame | null
  onSelecionar: (jogo: SteamGame | null) => void
  desabilitado?: boolean
  horasBiblioteca?: number
}

export function SteamAutocompleteInput({
  selecionado,
  onSelecionar,
  desabilitado = false,
  horasBiblioteca,
}: SteamAutocompleteInputProps) {
  const [termo, setTermo] = useState('')
  const termoAdiado = useDebounce(termo, 300)
  const [resultados, setResultados] = useState<SteamGame[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [indiceAtivo, setIndiceAtivo] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const aoClicarFora = (evento: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  useEffect(() => {
    const busca = termoAdiado.trim()

    if (busca.length < 2) {
      setResultados([])
      setCarregando(false)
      return
    }

    let ativo = true
    setCarregando(true)
    setErro('')

    buscarJogosSteam(busca)
      .then((jogos) => {
        if (!ativo) return
        setResultados(jogos)
        setIndiceAtivo(jogos.length > 0 ? 0 : -1)
        setAberto(true)
      })
      .catch((falha) => {
        if (!ativo) return
        setErro(mensagemDeErro(falha))
        setResultados([])
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [termoAdiado])

  function escolher(jogo: SteamGame) {
    onSelecionar(jogo)
    setTermo('')
    setResultados([])
    setAberto(false)
    setErro('')
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      setAberto(false)
      return
    }

    if (!aberto || resultados.length === 0) return

    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setIndiceAtivo((atual) => (atual + 1) % resultados.length)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setIndiceAtivo((atual) => (atual - 1 + resultados.length) % resultados.length)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      const jogo = resultados[indiceAtivo] ?? resultados[0]
      if (jogo) escolher(jogo)
    }
  }

  if (selecionado) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-2 p-3">
        <Cover
          src={selecionado.capa_url}
          titulo={selecionado.titulo}
          className="h-14 w-24 shrink-0 rounded-md border border-line"
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{selecionado.titulo}</p>
          <p className="text-xs text-muted">App Steam {selecionado.steam_appid}</p>
          {horasBiblioteca !== undefined && (
            <p className="text-xs text-amber">{horasBiblioteca}h na sua biblioteca Steam</p>
          )}
        </div>
        <a
          href={`https://store.steampowered.com/app/${selecionado.steam_appid}/`}
          target="_blank"
          rel="noreferrer"
          className="btn-quiet shrink-0"
          title="Abrir página na Steam"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Steam</span>
        </a>
        <button
          type="button"
          className="btn-quiet ml-auto shrink-0"
          onClick={() => onSelecionar(null)}
          disabled={desabilitado}
        >
          Trocar
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="text"
          className="field pl-9"
          placeholder="Busque pelo nome do jogo na Steam"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          onFocus={() => {
            if (resultados.length > 0) setAberto(true)
          }}
          onKeyDown={aoTeclar}
          disabled={desabilitado}
          role="combobox"
          aria-expanded={aberto}
          aria-controls="steam-resultados"
          aria-autocomplete="list"
          aria-label="Buscar jogo na Steam"
        />
        {carregando && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        )}
      </div>

      {aberto && resultados.length > 0 && (
        <ul
          id="steam-resultados"
          role="listbox"
          aria-label="Jogos encontrados na Steam"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
        >
          {resultados.map((jogo, indice) => (
            <li key={jogo.steam_appid} role="option" aria-selected={indice === indiceAtivo}>
              <button
                type="button"
                onClick={() => escolher(jogo)}
                onMouseEnter={() => setIndiceAtivo(indice)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                  indice === indiceAtivo ? 'bg-surface-2' : 'hover:bg-surface-2'
                }`}
              >
                <Cover
                  src={jogo.capa_url}
                  titulo={jogo.titulo}
                  className="h-11 w-20 shrink-0 rounded border border-line"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{jogo.titulo}</span>
                  <span className="block text-xs text-muted">App {jogo.steam_appid}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && !carregando && resultados.length === 0 && termoAdiado.trim().length >= 2 && (
        <p className="mt-2 text-xs text-muted">Nenhum jogo encontrado com esse nome.</p>
      )}

      {erro && <p className="mt-2 text-xs text-rose">{erro}</p>}
    </div>
  )
}
