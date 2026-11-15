import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

/**
 * Envolve páginas que exigem login. Preserva a rota de origem para voltar
 * depois de entrar.
 */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <LoadingSpinner label="Verificando sua sessão…" />
  }

  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ de: `${location.pathname}${location.search}` }} />
  }

  return <>{children}</>
}
