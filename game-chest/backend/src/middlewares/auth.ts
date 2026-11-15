import { NextFunction, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { AppError } from './errorHandler';
import { lerToken, tokenDaRequisicao, UsuarioSessao } from '../utils/auth';

/**
 * Resolve o usuário da sessão consultando o banco (assim nome/avatar/Steam
 * sempre refletem o estado atual, mesmo que o token seja antigo).
 */
export const carregarUsuario = async (req: Request): Promise<UsuarioSessao | null> => {
  const token = tokenDaRequisicao(req);
  if (!token) return null;

  const uid = lerToken(token);
  if (!uid) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, nome, email, steam_id, steam_nome, avatar_url
     FROM usuarios
     WHERE id = ?`,
    [uid]
  );

  if (rows.length === 0) return null;

  const usuario = rows[0];
  return {
    id: Number(usuario.id),
    nome: String(usuario.nome),
    email: String(usuario.email),
    steam_id: usuario.steam_id ? String(usuario.steam_id) : null,
    steam_nome: usuario.steam_nome ? String(usuario.steam_nome) : null,
    avatar_url: usuario.avatar_url ? String(usuario.avatar_url) : null
  };
};

/** Preenche req.usuario quando há sessão válida; nunca bloqueia a requisição. */
export const autenticacaoOpcional = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    req.usuario = await carregarUsuario(req);
    return next();
  } catch (error) {
    return next(error);
  }
};

/** Exige sessão válida; responde 401 quando o usuário não está logado. */
export const exigirLogin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const usuario = await carregarUsuario(req);

    if (!usuario) {
      return next(new AppError(401, 'Faça login para continuar.'));
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
};
