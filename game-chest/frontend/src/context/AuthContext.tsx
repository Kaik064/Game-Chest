import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  buscarSessao,
  desvincularContaSteam,
  entrarConta,
  registrarConta,
  sairConta,
  salvarPerfil,
} from '../lib/api'
import type { Usuario } from '../types'

interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  registrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
  atualizarPerfil: (nome: string) => Promise<void>
  desvincularSteam: () => Promise<void>
  recarregar: () => Promise<void>
}

const Contexto = createContext<AuthContexto | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    try {
      const sessao = await buscarSessao()
      setUsuario(sessao)
    } catch {
      // API fora do ar ou sem sessão: o app segue no modo visitante.
      setUsuario(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const entrar = useCallback(async (email: string, senha: string) => {
    const conta = await entrarConta(email, senha)
    setUsuario(conta)
  }, [])

  const registrar = useCallback(async (nome: string, email: string, senha: string) => {
    const conta = await registrarConta(nome, email, senha)
    setUsuario(conta)
  }, [])

  const sair = useCallback(async () => {
    try {
      await sairConta()
    } finally {
      setUsuario(null)
    }
  }, [])

  const atualizarPerfil = useCallback(async (nome: string) => {
    const conta = await salvarPerfil(nome)
    setUsuario(conta)
  }, [])

  const desvincularSteam = useCallback(async () => {
    await desvincularContaSteam()
    setUsuario((atual) =>
      atual ? { ...atual, steam_id: null, steam_nome: null, avatar_url: null } : atual,
    )
  }, [])

  const valor = useMemo<AuthContexto>(
    () => ({
      usuario,
      carregando,
      entrar,
      registrar,
      sair,
      atualizarPerfil,
      desvincularSteam,
      recarregar,
    }),
    [usuario, carregando, entrar, registrar, sair, atualizarPerfil, desvincularSteam, recarregar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): AuthContexto {
  const contexto = useContext(Contexto)

  if (!contexto) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }

  return contexto
}
