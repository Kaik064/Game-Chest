import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { formatarDataComFuso } from '../utils/date';

const STATUS_VALIDOS = ['Jogando', 'Zerado', 'Abandonado', 'Quero Jogar'] as const;
type StatusReview = (typeof STATUS_VALIDOS)[number];

interface ReviewInput {
  steam_appid: number;
  titulo: string;
  capa_url: string;
  horas_jogadas: number;
  status: StatusReview;
  nota: number;
  texto_review: string;
  data_lancamento: string | null;
  desenvolvedor: string | null;
  genero: string | null;
  avaliacao_steam: string | null;
  avaliacao_percentual: number | null;
  avaliacao_total: number | null;
}

const buildCapaUrl = (appid: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

const isStatusValido = (valor: unknown): valor is StatusReview =>
  typeof valor === 'string' && (STATUS_VALIDOS as readonly string[]).includes(valor);

const erroValidacao = (detalhes: string[]) =>
  new AppError(400, `Dados inválidos: ${detalhes.join(' ')}`);

/** Texto opcional: devolve null quando vazio e limita o tamanho. */
const textoOpcional = (valor: unknown, maximo: number): string | null => {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, maximo) : null;
};

/** Inteiro opcional dentro de um intervalo. */
const inteiroOpcional = (valor: unknown, minimo: number, maximo: number): number | null => {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) return null;
  return numero;
};

/**
 * Converte created_at/updated_at (Date vindo do mysql2, em UTC) para ISO com
 * offset no fuso configurado em APP_TIMEZONE.
 */
const comFuso = (row: Record<string, any>) => ({
  ...row,
  usuario_id: row.usuario_id === null || row.usuario_id === undefined ? null : Number(row.usuario_id),
  created_at: formatarDataComFuso(row.created_at),
  updated_at: formatarDataComFuso(row.updated_at)
});

/**
 * Valida e normaliza o corpo de criação de review.
 * O autor vem da sessão (req.usuario), nunca do corpo da requisição.
 */
const validarCriacao = (body: any): ReviewInput => {
  const detalhes: string[] = [];

  const steam_appid = Number(body?.steam_appid);
  if (!Number.isInteger(steam_appid) || steam_appid <= 0) {
    detalhes.push('"steam_appid" deve ser um número inteiro positivo.');
  }

  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  if (!titulo) detalhes.push('"titulo" é obrigatório.');
  else if (titulo.length > 255) detalhes.push('"titulo" deve ter no máximo 255 caracteres.');

  const capa_url =
    typeof body?.capa_url === 'string' && body.capa_url.trim() !== ''
      ? body.capa_url.trim()
      : Number.isInteger(steam_appid) && steam_appid > 0
        ? buildCapaUrl(steam_appid)
        : '';
  if (capa_url.length > 512) detalhes.push('"capa_url" deve ter no máximo 512 caracteres.');

  const horas_jogadas = body?.horas_jogadas === undefined ? 0 : Number(body.horas_jogadas);
  if (!Number.isInteger(horas_jogadas) || horas_jogadas < 0) {
    detalhes.push('"horas_jogadas" deve ser um número inteiro maior ou igual a zero.');
  }

  const status: StatusReview = body?.status === undefined ? 'Jogando' : body.status;
  if (!isStatusValido(status)) {
    detalhes.push(`"status" deve ser um de: ${STATUS_VALIDOS.join(', ')}.`);
  }

  const nota = Number(body?.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    detalhes.push('"nota" deve ser um número inteiro entre 1 e 5.');
  }

  const texto_review = typeof body?.texto_review === 'string' ? body.texto_review.trim() : '';
  if (!texto_review) detalhes.push('"texto_review" é obrigatório.');

  if (detalhes.length > 0) {
    throw erroValidacao(detalhes);
  }

  const avaliacaoTotalBruto = Number(body?.avaliacao_total);
  const avaliacaoTotal =
    Number.isInteger(avaliacaoTotalBruto) && avaliacaoTotalBruto >= 0
      ? avaliacaoTotalBruto
      : null;

  return {
    steam_appid,
    titulo,
    capa_url,
    horas_jogadas,
    status,
    nota,
    texto_review,
    data_lancamento: textoOpcional(body?.data_lancamento, 40),
    desenvolvedor: textoOpcional(body?.desenvolvedor, 255),
    genero: textoOpcional(body?.genero, 255),
    avaliacao_steam: textoOpcional(body?.avaliacao_steam, 120),
    avaliacao_percentual: inteiroOpcional(body?.avaliacao_percentual, 0, 100),
    avaliacao_total: avaliacaoTotal
  };
};

/**
 * POST /api/reviews
 * Cria a review (exige login) e garante o registro do jogo na tabela "jogos".
 */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const usuario = req.usuario;
  if (!usuario) {
    return next(new AppError(401, 'Faça login para publicar uma review.'));
  }

  let dados: ReviewInput;
  try {
    dados = validarCriacao(req.body);
  } catch (error) {
    return next(error);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO jogos
         (steam_appid, titulo, capa_url, data_lancamento, desenvolvedor, genero,
          avaliacao_steam, avaliacao_percentual, avaliacao_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         titulo = VALUES(titulo),
         capa_url = VALUES(capa_url),
         data_lancamento = COALESCE(VALUES(data_lancamento), data_lancamento),
         desenvolvedor = COALESCE(VALUES(desenvolvedor), desenvolvedor),
         genero = COALESCE(VALUES(genero), genero),
         avaliacao_steam = COALESCE(VALUES(avaliacao_steam), avaliacao_steam),
         avaliacao_percentual = COALESCE(VALUES(avaliacao_percentual), avaliacao_percentual),
         avaliacao_total = COALESCE(VALUES(avaliacao_total), avaliacao_total)`,
      [
        dados.steam_appid,
        dados.titulo,
        dados.capa_url,
        dados.data_lancamento,
        dados.desenvolvedor,
        dados.genero,
        dados.avaliacao_steam,
        dados.avaliacao_percentual,
        dados.avaliacao_total
      ]
    );

    const [gameRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM jogos WHERE steam_appid = ?',
      [dados.steam_appid]
    );

    if (gameRows.length === 0) {
      throw new AppError(500, 'Não foi possível registrar o jogo da review.');
    }

    const jogo_id = gameRows[0].id;

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO reviews (usuario_id, usuario, jogo_id, horas_jogadas, status, nota, texto_review)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario.id,
        usuario.nome,
        jogo_id,
        dados.horas_jogadas,
        dados.status,
        dados.nota,
        dados.texto_review
      ]
    );

    await connection.commit();

    return res.status(201).json({
      id: result.insertId,
      message: 'Review criada com sucesso!'
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/reviews?status=&usuario=&meus=1&ordem=&direcao=
 * Lista reviews com filtros e ordenação (padrão: mais recentes primeiro).
 */
export const listReviews = async (req: Request, res: Response, next: NextFunction) => {
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const usuarioFiltro = typeof req.query.usuario === 'string' ? req.query.usuario.trim() : '';
  const meus = req.query.meus === '1' || req.query.meus === 'true';
  const ordem = typeof req.query.ordem === 'string' ? req.query.ordem.trim() : 'created_at';
  const direcao = typeof req.query.direcao === 'string' ? req.query.direcao.trim() : 'desc';

  if (status && !isStatusValido(status)) {
    return next(
      new AppError(400, `Filtro "status" inválido. Use: ${STATUS_VALIDOS.join(', ')}.`)
    );
  }

  if (!['created_at', 'nota', 'horas_jogadas'].includes(ordem)) {
    return next(new AppError(400, 'Ordenação inválida. Use: created_at, nota ou horas_jogadas.'));
  }

  if (!['asc', 'desc'].includes(direcao.toLowerCase())) {
    return next(new AppError(400, 'Direção inválida. Use: asc ou desc.'));
  }

  if (meus && !req.usuario) {
    return next(new AppError(401, 'Faça login para ver suas reviews.'));
  }

  let sql = `
    SELECT r.id, r.usuario, r.usuario_id, r.horas_jogadas, r.status, r.nota, r.texto_review,
           r.created_at, r.updated_at,
           j.titulo, j.capa_url, j.steam_appid,
           j.data_lancamento, j.desenvolvedor, j.genero,
           j.avaliacao_steam, j.avaliacao_percentual, j.avaliacao_total
    FROM reviews r
    JOIN jogos j ON r.jogo_id = j.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }

  if (usuarioFiltro) {
    sql += ' AND r.usuario = ?';
    params.push(usuarioFiltro);
  }

  if (meus) {
    sql += ' AND r.usuario_id = ?';
    params.push(req.usuario!.id);
  }

  // Colunas e direção vêm de listas brancas (nunca interpolamos entrada do usuário direto).
  sql += ` ORDER BY r.${ordem} ${direcao.toUpperCase()}`;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return res.json(rows.map((row) => comFuso(row)));
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/reviews/:id
 */
export const getReviewById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, j.titulo, j.capa_url, j.steam_appid,
              j.data_lancamento, j.desenvolvedor, j.genero,
              j.avaliacao_steam, j.avaliacao_percentual, j.avaliacao_total
       FROM reviews r
       JOIN jogos j ON r.jogo_id = j.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError(404, 'Review não encontrada.'));
    }

    return res.json(comFuso(rows[0]));
  } catch (error) {
    return next(error);
  }
};

/** Garante que a review existe e pertence ao usuário logado. */
const exigirDonoDaReview = async (id: string | string[], usuarioId: number) => {
  const reviewId = Array.isArray(id) ? id[0] : id;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, usuario_id FROM reviews WHERE id = ?',
    [reviewId]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'Review não encontrada.');
  }

  const dono = rows[0].usuario_id;

  if (dono === null || dono === undefined || Number(dono) !== usuarioId) {
    throw new AppError(403, 'Você só pode alterar suas próprias reviews.');
  }
};

/**
 * PUT /api/reviews/:id
 * Atualização parcial: só os campos enviados são alterados.
 */
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const detalhes: string[] = [];

  const campos: string[] = [];
  const params: unknown[] = [];

  if (body.horas_jogadas !== undefined) {
    const horas_jogadas = Number(body.horas_jogadas);
    if (!Number.isInteger(horas_jogadas) || horas_jogadas < 0) {
      detalhes.push('"horas_jogadas" deve ser um número inteiro maior ou igual a zero.');
    } else {
      campos.push('horas_jogadas = ?');
      params.push(horas_jogadas);
    }
  }

  if (body.status !== undefined) {
    if (!isStatusValido(body.status)) {
      detalhes.push(`"status" deve ser um de: ${STATUS_VALIDOS.join(', ')}.`);
    } else {
      campos.push('status = ?');
      params.push(body.status);
    }
  }

  if (body.nota !== undefined) {
    const nota = Number(body.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      detalhes.push('"nota" deve ser um número inteiro entre 1 e 5.');
    } else {
      campos.push('nota = ?');
      params.push(nota);
    }
  }

  if (body.texto_review !== undefined) {
    const texto_review =
      typeof body.texto_review === 'string' ? body.texto_review.trim() : '';
    if (!texto_review) {
      detalhes.push('"texto_review" não pode ser vazio.');
    } else {
      campos.push('texto_review = ?');
      params.push(texto_review);
    }
  }

  if (detalhes.length > 0) {
    return next(erroValidacao(detalhes));
  }

  if (campos.length === 0) {
    return next(new AppError(400, 'Nenhum campo válido informado para atualização.'));
  }

  try {
    await exigirDonoDaReview(id, req.usuario!.id);

    await pool.query<ResultSetHeader>(
      `UPDATE reviews SET ${campos.join(', ')} WHERE id = ?`,
      [...params, id]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, j.titulo, j.capa_url, j.steam_appid,
              j.data_lancamento, j.desenvolvedor, j.genero,
              j.avaliacao_steam, j.avaliacao_percentual, j.avaliacao_total
       FROM reviews r
       JOIN jogos j ON r.jogo_id = j.id
       WHERE r.id = ?`,
      [id]
    );

    return res.json({
      message: 'Review atualizada com sucesso!',
      review: comFuso(rows[0])
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    await exigirDonoDaReview(id, req.usuario!.id);

    await pool.query<ResultSetHeader>('DELETE FROM reviews WHERE id = ?', [id]);

    return res.json({ message: 'Review excluída com sucesso.' });
  } catch (error) {
    return next(error);
  }
};
