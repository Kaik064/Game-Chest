import { NextFunction, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import {
  conferirSenha,
  criarHashSenha,
  definirCookieSessao,
  limparCookieSessao
} from '../utils/auth';
import { agoraComFuso, formatarDataComFuso } from '../utils/date';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TAMANHO_MINIMO_SENHA = 8;

interface UsuarioRow extends RowDataPacket {
  id: number;
  nome: string;
  email: string;
  steam_id: string | null;
  steam_nome: string | null;
  avatar_url: string | null;
  created_at?: Date | null;
}

/** Formato público do usuário: nunca inclui senha_hash. */
const usuarioPublico = (row: UsuarioRow) => ({
  id: Number(row.id),
  nome: String(row.nome),
  email: String(row.email),
  steam_id: row.steam_id ?? null,
  steam_nome: row.steam_nome ?? null,
  avatar_url: row.avatar_url ?? null,
  criado_em: formatarDataComFuso(row.created_at)
});

const buscarPorId = async (id: number): Promise<UsuarioRow | null> => {
  const [rows] = await pool.query<UsuarioRow[]>(
    `SELECT id, nome, email, steam_id, steam_nome, avatar_url, created_at
     FROM usuarios
     WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
};

const validarNome = (valor: unknown): string => {
  const nome = typeof valor === 'string' ? valor.trim() : '';
  if (nome.length < 2) {
    throw new AppError(400, 'Informe um nome com pelo menos 2 caracteres.');
  }
  if (nome.length > 100) {
    throw new AppError(400, 'O nome deve ter no máximo 100 caracteres.');
  }
  return nome;
};

/**
 * POST /api/auth/registrar
 * Cria a conta, já inicia a sessão e devolve o usuário.
 */
export const registrar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nome = validarNome(req.body?.nome);

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(email) || email.length > 190) {
      throw new AppError(400, 'Informe um e-mail válido.');
    }

    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';
    if (senha.length < TAMANHO_MINIMO_SENHA) {
      throw new AppError(
        400,
        `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
      );
    }
    if (senha.length > 72) {
      throw new AppError(400, 'A senha deve ter no máximo 72 caracteres.');
    }

    const [existentes] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    if (existentes.length > 0) {
      throw new AppError(409, 'Já existe uma conta com este e-mail. Tente entrar.');
    }

    const senha_hash = await criarHashSenha(senha);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senha_hash]
    );

    definirCookieSessao(res, result.insertId);

    const usuario = await buscarPorId(result.insertId);
    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      usuario: usuario ? usuarioPublico(usuario) : null
    });
  } catch (error) {
    if (typeof (error as any)?.code === 'string' && (error as any).code === 'ER_DUP_ENTRY') {
      return next(new AppError(409, 'Já existe uma conta com este e-mail. Tente entrar.'));
    }
    return next(error);
  }
};

/**
 * POST /api/auth/entrar
 */
export const entrar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = typeof req.body?.senha === 'string' ? req.body.senha : '';

    if (!email || !senha) {
      throw new AppError(400, 'Informe e-mail e senha.');
    }

    const [rows] = await pool.query<(UsuarioRow & { senha_hash: string })[]>(
      `SELECT id, nome, email, steam_id, steam_nome, avatar_url, created_at, senha_hash
       FROM usuarios
       WHERE email = ?`,
      [email]
    );

    const usuario = rows[0];

    // Mesma mensagem para e-mail inexistente e senha errada (não vaza cadastro).
    const senhaConfere = usuario ? await conferirSenha(senha, usuario.senha_hash) : false;
    if (!usuario || !senhaConfere) {
      throw new AppError(401, 'E-mail ou senha inválidos.');
    }

    definirCookieSessao(res, usuario.id);

    return res.json({
      message: 'Login realizado com sucesso!',
      usuario: usuarioPublico(usuario)
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/auth/sair
 */
export const sair = async (_req: Request, res: Response) => {
  limparCookieSessao(res);
  return res.json({ message: 'Sessão encerrada.' });
};

/**
 * GET /api/auth/eu
 * Devolve o usuário da sessão ou null (consulta pública).
 */
export const eu = async (req: Request, res: Response) => {
  return res.json({ usuario: req.usuario ?? null });
};

/**
 * PUT /api/auth/perfil
 * Atualiza o nome de exibição e propaga para as reviews já publicadas.
 */
export const atualizarPerfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = req.usuario;
    if (!usuario) throw new AppError(401, 'Faça login para continuar.');

    const nome = validarNome(req.body?.nome);

    if (nome !== usuario.nome) {
      await pool.query<ResultSetHeader>('UPDATE usuarios SET nome = ? WHERE id = ?', [
        nome,
        usuario.id
      ]);
      // Mantém o nome exibido no feed/diário coerente com o perfil.
      await pool.query<ResultSetHeader>(
        'UPDATE reviews SET usuario = ? WHERE usuario_id = ?',
        [nome, usuario.id]
      );
    }

    const atualizado = await buscarPorId(usuario.id);
    return res.json({
      message: 'Perfil atualizado.',
      usuario: atualizado ? usuarioPublico(atualizado) : null
    });
  } catch (error) {
    return next(error);
  }
};

export const urlPublicaApi = () =>
  (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');

export const urlFrontend = () =>
  (process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');

/**
 * GET /api/auth/steam/vincular
 * Inicia o fluxo OpenID 2.0 da Steam (o usuário precisa estar logado).
 */
export const iniciarVinculoSteam = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.usuario) throw new AppError(401, 'Faça login para vincular sua conta Steam.');

    const retorno = `${urlPublicaApi()}/api/auth/steam/retorno`;
    const parametros = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': retorno,
      'openid.realm': urlPublicaApi(),
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    return res.redirect(302, `https://steamcommunity.com/openid/login?${parametros.toString()}`);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/auth/steam/retorno
 * Valida a resposta OpenID 2.0 da Steam e grava o SteamID64 na conta.
 * Sempre termina com redirect para o perfil (nunca devolve JSON).
 */
export const retornoVinculoSteam = async (req: Request, res: Response) => {
  const destino = (consulta: string) => `${urlFrontend()}/perfil?${consulta}`;
  const erro = (mensagem: string) =>
    res.redirect(302, destino(`steam=erro&motivo=${encodeURIComponent(mensagem)}`));

  if (!req.usuario) {
    return erro('Sessão expirada. Entre novamente e repita o vínculo com a Steam.');
  }

  try {
    const consulta = req.originalUrl.split('?')[1] ?? '';
    const corpo = new URLSearchParams(consulta);

    if (corpo.get('openid.mode') !== 'id_res') {
      return erro('A Steam não autorizou o vínculo. Tente novamente.');
    }

    const claimedId = corpo.get('openid.claimed_id') ?? '';
    const resultado = claimedId.match(
      /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/
    );

    if (!resultado) {
      return erro('Resposta de identificação da Steam inválida.');
    }

    const steamId = resultado[1];

    // Confirma a assinatura diretamente nos servidores da Steam.
    corpo.set('openid.mode', 'check_authentication');

    const verificacao = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corpo.toString(),
      signal: AbortSignal.timeout(10_000)
    });

    const texto = await verificacao.text();

    if (!/is_valid\s*:\s*true/i.test(texto)) {
      return erro('A Steam não confirmou o vínculo. Tente de novo.');
    }

    const [jaVinculada] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM usuarios WHERE steam_id = ? AND id <> ?',
      [steamId, req.usuario.id]
    );

    if (jaVinculada.length > 0) {
      return erro('Esta conta Steam já está vinculada a outro usuário do Game Chest.');
    }

    // Nome/avatar públicos da Steam são um extra: se falharem, o vínculo continua válido.
    let steamNome: string | null = null;
    let avatarUrl: string | null = null;

    try {
      const perfil = await fetch(
        `https://steamcommunity.com/profiles/${steamId}?xml=1`,
        { signal: AbortSignal.timeout(8_000) }
      );
      if (perfil.ok) {
        const xml = await perfil.text();
        steamNome = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/)?.[1]?.trim() ?? null;
        avatarUrl =
          xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/)?.[1]?.trim() ?? null;
      }
    } catch {
      // sem problema: o usuário ainda pode usar a biblioteca
    }

    await pool.query<ResultSetHeader>(
      `UPDATE usuarios
       SET steam_id = ?, steam_nome = ?, avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [steamId, steamNome, avatarUrl, req.usuario.id]
    );

    return res.redirect(302, destino('steam=ok'));
  } catch (falha) {
    console.error(`[${agoraComFuso()}] Falha no vínculo Steam:`, falha);
    return erro('Não foi possível concluir o vínculo com a Steam agora.');
  }
};

/**
 * POST /api/auth/steam/desvincular
 */
export const desvincularSteam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = req.usuario;
    if (!usuario) throw new AppError(401, 'Faça login para continuar.');

    await pool.query<ResultSetHeader>(
      'UPDATE usuarios SET steam_id = NULL, steam_nome = NULL WHERE id = ?',
      [usuario.id]
    );

    return res.json({ message: 'Conta Steam desvinculada.' });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/usuarios?q=nome
 * Busca pública de perfis para descoberta no feed.
 */
export const buscarUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  const termo = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (termo.length < 2) return res.json([]);

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.steam_nome, u.avatar_url,
              COUNT(r.id) AS total_reviews
       FROM usuarios u
       LEFT JOIN reviews r ON r.usuario_id = u.id
       WHERE u.nome LIKE ?
       GROUP BY u.id, u.nome, u.steam_nome, u.avatar_url
       ORDER BY total_reviews DESC, u.nome ASC
       LIMIT 20`,
      [`%${termo}%`]
    );

    return res.json(
      rows.map((row) => ({
        id: Number(row.id),
        nome: String(row.nome),
        steam_nome: row.steam_nome ?? null,
        avatar_url: row.avatar_url ?? null,
        total_reviews: Number(row.total_reviews ?? 0)
      }))
    );
  } catch (error) {
    return next(error);
  }
};

/** GET /api/usuarios/:id — perfil público e reviews do usuário. */
export const perfilPublico = async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return next(new AppError(400, 'Usuário inválido.'));
  }

  try {
    const [usuarios] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.steam_nome, u.avatar_url,
              COUNT(r.id) AS total_reviews
       FROM usuarios u
       LEFT JOIN reviews r ON r.usuario_id = u.id
       WHERE u.id = ?
       GROUP BY u.id, u.nome, u.steam_nome, u.avatar_url`,
      [id]
    );

    if (usuarios.length === 0) return next(new AppError(404, 'Usuário não encontrado.'));

    const [reviews] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.usuario, r.usuario_id, r.horas_jogadas, r.status, r.nota,
              r.texto_review, r.created_at, r.updated_at,
              j.titulo, j.capa_url, j.steam_appid,
              j.data_lancamento, j.desenvolvedor, j.genero,
              j.avaliacao_steam, j.avaliacao_percentual, j.avaliacao_total
       FROM reviews r
       JOIN jogos j ON j.id = r.jogo_id
       WHERE r.usuario_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    return res.json({
      usuario: {
        id: Number(usuarios[0].id),
        nome: String(usuarios[0].nome),
        steam_nome: usuarios[0].steam_nome ?? null,
        avatar_url: usuarios[0].avatar_url ?? null,
        total_reviews: Number(usuarios[0].total_reviews ?? 0)
      },
      reviews: reviews.map((row) => ({
        ...row,
        id: Number(row.id),
        usuario_id: Number(row.usuario_id),
        horas_jogadas: Number(row.horas_jogadas),
        nota: Number(row.nota),
        created_at: formatarDataComFuso(row.created_at),
        updated_at: formatarDataComFuso(row.updated_at)
      }))
    });
  } catch (error) {
    return next(error);
  }
};
