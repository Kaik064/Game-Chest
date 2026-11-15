import type { UsuarioSessao } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      /** Preenchido por autenticacaoOpcional / exigirLogin. */
      usuario?: UsuarioSessao | null;
    }
  }
}

export {};
