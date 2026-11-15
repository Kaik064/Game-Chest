import { useCallback, useEffect, useState } from 'react'

const CHAVE_USUARIO = 'gamechest:usuario'
const CHAVE_STEAM = 'gamechest:steamId'
const EVENTO = 'gamechest:perfil-alterado'

function ler(chave: string): string {
  try {
    return localStorage.getItem(chave) ?? ''
  } catch {
    return ''
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    // localStorage indisponível (modo privado): segue apenas em memória.
  }
}

export function useUsuario() {
  const [usuario, setUsuario] = useState(() => ler(CHAVE_USUARIO))
  const [steamId, setSteamId] = useState(() => ler(CHAVE_STEAM))

  useEffect(() => {
    const sincronizar = () => {
      setUsuario(ler(CHAVE_USUARIO))
      setSteamId(ler(CHAVE_STEAM))
    }
    window.addEventListener(EVENTO, sincronizar)
    window.addEventListener('storage', sincronizar)
    return () => {
      window.removeEventListener(EVENTO, sincronizar)
      window.removeEventListener('storage', sincronizar)
    }
  }, [])

  const definirUsuario = useCallback((valor: string) => {
    const limpo = valor.trim()
    setUsuario(limpo)
    gravar(CHAVE_USUARIO, limpo)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  const definirSteamId = useCallback((valor: string) => {
    const limpo = valor.trim()
    setSteamId(limpo)
    gravar(CHAVE_STEAM, limpo)
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  return { usuario, steamId, definirUsuario, definirSteamId }
}
