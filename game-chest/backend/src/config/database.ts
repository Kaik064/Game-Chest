import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config();

const sslCaPath = process.env.DB_SSL_CA_PATH;

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    ssl: {
      minVersion: 'TLSv1.2',
      ...(sslCaPath ? { ca: readFileSync(sslCaPath) } : {})
    }
});

/*
  Esse erro aconteceu porque o arquivo principal da API (src/server.ts) ainda não foi criado!

  O comando npm run dev do back-end tenta executar o src/server.ts, mas ele ainda não existia.

  Para a API ligar perfeitamente, precisamos criar os arquivos que faltam dentro de game-chest/backend/src/:
  ──────
  ### 1. Criar src/controllers/steamController.ts

  Crie o arquivo em steamController.ts e cole:

    import { Request, Response } from 'express';

    export const searchSteamGames = async (req: Request, res: Response) => {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        return res.json([]);
      }

      try {
        const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=portuguese&cc=BR`;
        const response = await fetch(steamUrl);
        const data: any = await response.json();

        const games = (data.items || []).map((item: any) => ({
          steam_appid: item.id,
          titulo: item.name,
          capa_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`
        }));

        return res.json(games);
      } catch (error) {
        return res.status(500).json({ error: 'Erro ao consultar o catálogo da Steam' });
      }
    };
  ──────
  ### 2. Criar src/controllers/reviewController.ts

  Crie o arquivo em reviewController.ts e cole:

    import { Request, Response } from 'express';
    import { pool } from '../config/database';
    import { RowDataPacket, ResultSetHeader } from 'mysql2';

    export const createReview = async (req: Request, res: Response) => {
      const { usuario, steam_appid, titulo, capa_url, horas_jogadas, status, nota, texto_review } = req.body;

      if (!usuario || !steam_appid || !titulo || !nota || !texto_review) {
        return res.status(400).json({ message: 'Campos obrigatórios não informados.' });
      }

      try {
        await pool.query(
          `INSERT INTO jogos (steam_appid, titulo, capa_url)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), capa_url = VALUES(capa_url)`,
          [steam_appid, titulo, capa_url]
        );

        const [gameRows] = await pool.query<RowDataPacket[]>(
          'SELECT id FROM jogos WHERE steam_appid = ?',
          [steam_appid]
        );
        const jogo_id = gameRows[0].id;

        const [result] = await pool.query<ResultSetHeader>(
          `INSERT INTO reviews (usuario, jogo_id, horas_jogadas, status, nota, texto_review)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [usuario, jogo_id, horas_jogadas || 0, status || 'Jogando', nota, texto_review]
        );

        return res.status(201).json({ id: result.insertId, message: 'Review criada com sucesso!' });
      } catch (error) {
        return res.status(500).json({ message: 'Erro interno ao salvar review.' });
      }
    };

    export const listReviews = async (req: Request, res: Response) => {
      const { status, usuario } = req.query;
      let sql = `
        SELECT r.id, r.usuario, r.horas_jogadas, r.status, r.nota, r.texto_review, r.created_at,
               j.titulo, j.capa_url, j.steam_appid
        FROM reviews r
        JOIN jogos j ON r.jogo_id = j.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status) {
        sql += ' AND r.status = ?';
        params.push(status);
      }
      if (usuario) {
        sql += ' AND r.usuario = ?';
        params.push(usuario);
      }

      sql += ' ORDER BY r.created_at DESC';

      try {
        const [rows] = await pool.query(sql, params);
        return res.json(rows);
      } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar reviews.' });
      }
    };

    export const getReviewById = async (req: Request, res: Response) => {
      const { id } = req.params;
      try {
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT r.*, j.titulo, j.capa_url, j.steam_appid
           FROM reviews r
           JOIN jogos j ON r.jogo_id = j.id
           WHERE r.id = ?`,
          [id]
        );

        if (rows.length === 0) {
          return res.status(404).json({ message: 'Review não encontrada.' });
        }
        return res.json(rows[0]);
      } catch (error) {
        return res.status(500).json({ message: 'Erro ao consultar review.' });
      }
    };

    export const updateReview = async (req: Request, res: Response) => {
      const { id } = req.params;
      const { horas_jogadas, status, nota, texto_review } = req.body;

      try {
        const [result] = await pool.query<ResultSetHeader>(
          `UPDATE reviews
           SET horas_jogadas = ?, status = ?, nota = ?, texto_review = ?
           WHERE id = ?`,
          [horas_jogadas, status, nota, texto_review, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Review não encontrada para atualização.' });
        }

        return res.json({ message: 'Review atualizada com sucesso!' });
      } catch (error) {
        return res.status(500).json({ message: 'Erro ao atualizar review.' });
      }
    };

    export const deleteReview = async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM reviews WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Review não encontrada para exclusão.' });
        }
        return res.json({ message: 'Review excluída com sucesso.' });
      } catch (error) {
        return res.status(500).json({ message: 'Erro ao excluir review.' });
      }
    };
  ──────
  ### 3. Criar src/routes/steamRoutes.ts

  Crie o arquivo em steamRoutes.ts e cole:

    import { Router } from 'express';
    import { searchSteamGames } from '../controllers/steamController';

    const router = Router();
    router.get('/search', searchSteamGames);

    export default router;
  ──────
  ### 4. Criar src/routes/reviewRoutes.ts

  Crie o arquivo em reviewRoutes.ts e cole:

    import { Router } from 'express';
    import {
      createReview,
      listReviews,
      getReviewById,
      updateReview,
      deleteReview
    } from '../controllers/reviewController';

    const router = Router();

    router.post('/', createReview);
    router.get('/', listReviews);
    router.get('/:id', getReviewById);
    router.put('/:id', updateReview);
    router.delete('/:id', deleteReview);

    export default router;
  ──────
  ### 5. Criar src/server.ts

  Crie o arquivo em server.ts e cole:

    import express from 'express';
    import cors from 'cors';
    import dotenv from 'dotenv';
    import reviewRoutes from './routes/reviewRoutes';
    import steamRoutes from './routes/steamRoutes';

    dotenv.config();

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors({ origin: 'http://localhost:5173' }));
    app.use(express.json());

    app.use('/api/reviews', reviewRoutes);
    app.use('/api/steam', steamRoutes);

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({
        error: true,
        message: 'Ocorreu um erro interno no servidor.',
        timestamp: new Date().toISOString()
      });
    });

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  ──────
  Assim que colar esses arquivos, rode novamente no terminal do backend:

    npm run dev

  Ele vai iniciar com a mensagem: Servidor rodando em http://localhost:3000!
*/
