export const STATUSES = ['Jogando', 'Zerado', 'Abandonado', 'Quero Jogar'] as const

export type Status = (typeof STATUSES)[number]

export interface Usuario {
  id: number
  nome: string
  email: string
  steam_id: string | null
  steam_nome: string | null
  avatar_url: string | null
  criado_em?: string | null
}

export interface UsuarioEncontrado {
  id: number
  nome: string
  steam_nome: string | null
  avatar_url: string | null
  total_reviews: number
}

export interface AvaliacaoSteam {
  descricao: string
  positivas: number
  negativas: number
  total: number
  percentual: number | null
}

export interface JogoDetalhes {
  steam_appid: number
  titulo: string
  capa_url: string
  tipo: string | null
  data_lancamento: string | null
  desenvolvedor: string | null
  publicadora: string | null
  genero: string | null
  descricao_curta: string | null
  gratuito: boolean
  url_loja: string
  preco: string | null
  preco_original: string | null
  desconto_percentual: number
  avaliacao: AvaliacaoSteam | null
}

export interface Review {
  id: number
  usuario: string
  usuario_id?: number | null
  jogo_id?: number
  horas_jogadas: number
  status: Status
  nota: number
  texto_review: string
  created_at: string
  updated_at?: string
  titulo: string
  capa_url: string
  steam_appid: number
  data_lancamento?: string | null
  desenvolvedor?: string | null
  genero?: string | null
  avaliacao_steam?: string | null
  avaliacao_percentual?: number | null
  avaliacao_total?: number | null
}

export interface SteamGame {
  steam_appid: number
  titulo: string
  capa_url: string
}

export interface SteamOwnedGame extends SteamGame {
  horas_jogadas: number
  ultimo_jogo_em: string | null
}

export interface BibliotecaSteam {
  steam_id: string
  steam_nome: string | null
  avatar_url: string | null
  jogos: SteamOwnedGame[]
  total_jogos: number
  total_horas: number
}

export interface ReviewPayload {
  steam_appid: number
  titulo: string
  capa_url: string
  horas_jogadas: number
  status: Status
  nota: number
  texto_review: string
  data_lancamento?: string | null
  desenvolvedor?: string | null
  genero?: string | null
  avaliacao_steam?: string | null
  avaliacao_percentual?: number | null
  avaliacao_total?: number | null
}

export interface ReviewUpdatePayload {
  horas_jogadas?: number
  status?: Status
  nota?: number
  texto_review?: string
}
