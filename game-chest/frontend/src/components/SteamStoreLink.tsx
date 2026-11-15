import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { buscarDetalhesJogo } from '../lib/api'

interface SteamStoreLinkProps {
  appid: number
  compacto?: boolean
}

/** Preço atual + link oficial, carregados sob demanda a partir do AppID. */
export function SteamStoreLink({ appid, compacto = false }: SteamStoreLinkProps) {
  const [preco, setPreco] = useState<string | null>(null)
  const [url, setUrl] = useState(`https://store.steampowered.com/app/${appid}/`)

  useEffect(() => {
    let ativo = true
    buscarDetalhesJogo(appid)
      .then((detalhes) => {
        if (!ativo) return
        setPreco(detalhes.preco)
        setUrl(detalhes.url_loja)
      })
      .catch(() => {
        // O link genérico continua disponível mesmo se a Steam estiver lenta.
      })
    return () => { ativo = false }
  }, [appid])

  return (
    <span className={`inline-flex items-center gap-2 ${compacto ? 'text-xs' : 'text-sm'}`}>
      {preco && <span className="font-medium text-amber">{preco}</span>}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-muted underline decoration-line/70 underline-offset-4 transition-colors hover:text-paper"
        title="Abrir página do jogo na Steam"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        <span>Ver na Steam</span>
      </a>
    </span>
  )
}
