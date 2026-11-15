/**
 * Cache em memória com TTL — suficiente para não martelar a Steam a cada
 * requisição. Não há dependência externa: reiniciar o processo limpa o cache.
 */

interface Entrada<T> {
  expiraEm: number;
  valor: T;
}

const armazenamento = new Map<string, Entrada<unknown>>();
const LIMITE_ENTRADAS = 500;

export async function comCache<T>(
  chave: string,
  ttlMs: number,
  carregar: () => Promise<T>
): Promise<T> {
  const agora = Date.now();
  const existente = armazenamento.get(chave) as Entrada<T> | undefined;

  if (existente && existente.expiraEm > agora) {
    return existente.valor;
  }

  const valor = await carregar();

  if (armazenamento.size >= LIMITE_ENTRADAS) {
    const agoraLimpeza = Date.now();
    for (const [chaveAntiga, entrada] of armazenamento) {
      if (entrada.expiraEm <= agoraLimpeza) armazenamento.delete(chaveAntiga);
    }
    // Se ainda estiver cheio, descarta a entrada mais antiga.
    if (armazenamento.size >= LIMITE_ENTRADAS) {
      const primeira = armazenamento.keys().next();
      if (!primeira.done) armazenamento.delete(primeira.value);
    }
  }

  armazenamento.set(chave, { expiraEm: agora + ttlMs, valor });
  return valor;
}

export function limparCache(): void {
  armazenamento.clear();
}
