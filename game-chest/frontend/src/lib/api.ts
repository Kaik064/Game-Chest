import axios from 'axios'
import type {
  BibliotecaSteam,
  JogoDetalhes,
  Review,
  ReviewPayload,
  ReviewUpdatePayload,
  Status,
  SteamGame,
  Usuario,
  UsuarioEncontrado,
} from '../types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 15000,
  // Necessário para o cookie httpOnly da sessão atravessar front (5173) -> API (3000).
  withCredentials: true,
})

interface ListarParams {
  status?: Status
  usuario?: string
  meus?: boolean
  ordem?: 'created_at' | 'nota' | 'horas_jogadas'
  direcao?: 'asc' | 'desc'
}

export async function listarReviews(params: ListarParams = {}): Promise<Review[]> {
  const { meus, ...resto } = params
  const { data } = await api.get<Review[]>('/reviews', {
    params: { ...resto, ...(meus ? { meus: '1' } : {}) },
  })
  return data
}

export async function buscarReview(id: number | string): Promise<Review> {
  const { data } = await api.get<Review>(`/reviews/${id}`)
  return data
}

export async function criarReview(
  payload: ReviewPayload,
): Promise<{ id: number; message: string }> {
  const { data } = await api.post<{ id: number; message: string }>('/reviews', payload)
  return data
}

export async function atualizarReview(
  id: number | string,
  payload: ReviewUpdatePayload,
): Promise<{ message: string; review: Review }> {
  const { data } = await api.put<{ message: string; review: Review }>(`/reviews/${id}`, payload)
  return data
}

export async function excluirReview(id: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/reviews/${id}`)
  return data
}

/* ------------------------------------------------------------------ */
/* Contas                                                              */
/* ------------------------------------------------------------------ */

export async function buscarSessao(): Promise<Usuario | null> {
  const { data } = await api.get<{ usuario: Usuario | null }>('/auth/eu')
  return data.usuario
}

export async function registrarConta(
  nome: string,
  email: string,
  senha: string,
): Promise<Usuario> {
  const { data } = await api.post<{ usuario: Usuario }>('/auth/registrar', { nome, email, senha })
  return data.usuario
}

export async function entrarConta(email: string, senha: string): Promise<Usuario> {
  const { data } = await api.post<{ usuario: Usuario }>('/auth/entrar', { email, senha })
  return data.usuario
}

export async function sairConta(): Promise<void> {
  await api.post('/auth/sair')
}

export async function salvarPerfil(nome: string): Promise<Usuario> {
  const { data } = await api.put<{ usuario: Usuario }>('/auth/perfil', { nome })
  return data.usuario
}

export async function desvincularContaSteam(): Promise<void> {
  await api.post('/auth/steam/desvincular')
}

export async function buscarUsuarios(termo: string): Promise<UsuarioEncontrado[]> {
  const { data } = await api.get<UsuarioEncontrado[]>('/auth/usuarios', { params: { q: termo } })
  return data
}

export async function buscarPerfilPublico(id: number | string): Promise<{
  usuario: UsuarioEncontrado
  reviews: Review[]
}> {
  const { data } = await api.get<{ usuario: UsuarioEncontrado; reviews: Review[] }>(`/auth/usuarios/${id}`)
  return data
}

/** URL de início do fluxo OpenID da Steam (navegação de página inteira). */
export function urlVincularSteam(): string {
  return `${api.defaults.baseURL}/auth/steam/vincular`
}

/* ------------------------------------------------------------------ */
/* Steam                                                               */
/* ------------------------------------------------------------------ */

export async function buscarJogosSteam(q: string): Promise<SteamGame[]> {
  const { data } = await api.get<SteamGame[]>('/steam/search', { params: { q } })
  return data
}

export async function buscarDetalhesJogo(appid: number): Promise<JogoDetalhes> {
  const { data } = await api.get<JogoDetalhes>(`/steam/app/${appid}`, { timeout: 20000 })
  return data
}

export async function bibliotecaSteam(): Promise<BibliotecaSteam> {
  const { data } = await api.get<BibliotecaSteam>('/steam/biblioteca', { timeout: 25000 })
  return data
}

export function mensagemDeErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    const dados = erro.response?.data as { message?: string } | undefined
    if (dados?.message) {
      return dados.message
    }
    if (erro.code === 'ERR_NETWORK') {
      return 'Não foi possível falar com a API. Confira se o backend está rodando em http://localhost:3000.'
    }
    if (erro.code === 'ECONNABORTED') {
      return 'A API demorou demais para responder. Tente de novo.'
    }
  }
  return 'Algo deu errado. Tente de novo em instantes.'
}
