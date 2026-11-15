import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import reviewRoutes from './routes/reviewRoutes';
import steamRoutes from './routes/steamRoutes';
import { pool } from './config/database';
import { AppError, errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { agoraComFuso } from './utils/date';

// O .env local deve substituir variáveis vazias herdadas do processo (comum
// quando o backend foi iniciado antes de a chave Steam ser preenchida).
dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Atrás de proxy (Render/Railway/Nginx) o cookie Secure depende de X-Forwarded-Proto.
app.set('trust proxy', 1);

// Origens permitidas no CORS (lista separada por vírgula no .env).
const origensPermitidas = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Requisições sem Origin (curl, Postman, proxy) são permitidas.
      if (!origin || origensPermitidas.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(403, `Origem não permitida pelo CORS: ${origin}`));
    }
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check: útil para validar a conexão com o TiDB/MySQL.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      status: 'ok',
      banco: 'conectado',
      timestamp: agoraComFuso()
    });
  } catch {
    return res.status(503).json({
      status: 'degradado',
      banco: 'indisponível',
      timestamp: agoraComFuso()
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/steam', steamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);

  if (!process.env.JWT_SECRET?.trim()) {
    console.warn(
      'Aviso: JWT_SECRET não configurado — login/cadastro responderão 503 até você definir a variável no .env.'
    );
  }
  if (!process.env.STEAM_API_KEY?.trim()) {
    console.warn(
      'Aviso: STEAM_API_KEY não configurada — busca de catálogo funciona, mas a biblioteca/horas da Steam retorna 503.'
    );
  }
});
