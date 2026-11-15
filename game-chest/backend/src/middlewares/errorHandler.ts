import { Request, Response, NextFunction } from 'express';
import { agoraComFuso } from '../utils/date';

/**
 * Erro de aplicação com código HTTP associado.
 * Lançado pelos controllers e capturado pelo middleware global de erros.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Rota não encontrada (executa antes do tratador de erros).
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    error: true,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: agoraComFuso()
  });
};

/**
 * Middleware global de tratamento de erros.
 * Mantém o contrato de resposta padronizado:
 * { error, message, timestamp }.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (res.headersSent) {
    return;
  }

  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err?.message || 'Ocorreu um erro interno no servidor.';

  // Banco indisponível / credenciais inválidas
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT' || err?.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Não foi possível conectar ao banco de dados. Verifique se o serviço está ativo.';
  } else if (typeof err?.code === 'string' && err.code.startsWith('ER_')) {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] Erro ${statusCode}:`, err);
    // Não expõe detalhes internos do banco/stack para o cliente.
    if (!(err instanceof AppError)) {
      message = 'Ocorreu um erro interno no servidor.';
    }
  }

  return res.status(statusCode).json({
    error: true,
    message,
    timestamp: agoraComFuso()
  });
};
