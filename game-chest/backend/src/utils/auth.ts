import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { CookieOptions, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';

/** Nome do cookie httpOnly que carrega o token de sessão. */
export const COOKIE_SESSAO = 'gc_sessao';

const DIAS_SESSAO = 30;
const MS_SESSAO = DIAS_SESSAO * 24 * 60 * 60 * 1000;

/** Usuário autenticado anexado em req.usuario pelo middleware de sessão. */
export interface UsuarioSessao {
  id: number;
  nome: string;
  email: string;
  steam_id: string | null;
  steam_nome: string | null;
  avatar_url: string | null;
}

interface TokenPayload {
  uid: number;
}

/** Segredo obrigatório: sem ele a autenticação falha de forma explícita. */
const segredo = (): string => {
  const valor = process.env.JWT_SECRET?.trim();
  if (!valor) {
    throw new AppError(
      503,
      'Autenticação indisponível: configure a variável JWT_SECRET no arquivo .env.'
    );
  }
  return valor;
};

export const criarHashSenha = (senha: string): Promise<string> => bcrypt.hash(senha, 10);

export const conferirSenha = (senha: string, hash: string): Promise<boolean> =>
  bcrypt.compare(senha, hash);

export const gerarToken = (uid: number): string =>
  jwt.sign({ uid } satisfies TokenPayload, segredo(), { expiresIn: `${DIAS_SESSAO}d` });

/** Valida o token e devolve o id do usuário, ou null quando inválido/expirado. */
export const lerToken = (token: string): number | null => {
  try {
    const dados = jwt.verify(token, segredo()) as TokenPayload;
    return Number.isInteger(dados?.uid) ? dados.uid : null;
  } catch {
    return null;
  }
};

const opcoesCookie = (): CookieOptions => {
  // Em produção o cookie exige HTTPS. Em localhost o navegador aceita SameSite=Lax.
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

  const sameSite =
    process.env.COOKIE_SAMESITE === 'none' || process.env.COOKIE_SAMESITE === 'strict'
      ? process.env.COOKIE_SAMESITE
      : 'lax';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: MS_SESSAO
  };
};

export const definirCookieSessao = (res: Response, uid: number): void => {
  res.cookie(COOKIE_SESSAO, gerarToken(uid), opcoesCookie());
};

export const limparCookieSessao = (res: Response): void => {
  const { maxAge: _maxAge, ...resto } = opcoesCookie();
  res.clearCookie(COOKIE_SESSAO, resto);
};

/**
 * Lê o token do cookie httpOnly ou, como alternativa para scripts/testes,
 * do cabeçalho Authorization: Bearer <token>.
 */
export const tokenDaRequisicao = (req: Request): string => {
  const doCookie = req.cookies?.[COOKIE_SESSAO];
  if (typeof doCookie === 'string' && doCookie.trim()) {
    return doCookie.trim();
  }

  const cabecalho = req.headers.authorization;
  if (typeof cabecalho === 'string' && cabecalho.toLowerCase().startsWith('bearer ')) {
    return cabecalho.slice(7).trim();
  }

  return '';
};
