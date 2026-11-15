import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { comCache } from '../utils/cache';
import { formatarDataComFuso } from '../utils/date';

const STEAM_SEARCH_URL = 'https://store.steampowered.com/api/storesearch/';
const STEAM_APP_DETAILS_URL = 'https://store.steampowered.com/api/appdetails';
const STEAM_APP_REVIEWS_URL = 'https://api.steampowered.com/IUserReviewsService/GetAppReviews/v1/';
const STEAM_OWNED_GAMES_URL = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/';
const REQUEST_TIMEOUT_MS = 10_000;

const TTL_BUSCA_MS = 5 * 60 * 1000;
const TTL_DETALHES_MS = 6 * 60 * 60 * 1000;
const TTL_BIBLIOTECA_MS = 10 * 60 * 1000;

interface SteamStoreItem {
  id?: number;
  name?: string;
  type?: string;
  tiny_image?: string;
}

interface SteamOwnedGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
  rtime_last_played?: number;
}

interface AppDetailsData {
  name?: string;
  type?: string;
  header_image?: string;
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { description?: string }[];
  release_date?: { date?: string; coming_soon?: boolean };
  is_free?: boolean;
  price_overview?: {
    currency?: string;
    initial?: number;
    final?: number;
    discount_percent?: number;
    initial_formatted?: string;
    final_formatted?: string;
  };
}

interface ReviewSummary {
  review_score?: number;
  review_score_desc?: string;
  total_positive?: number;
  total_negative?: number;
  total_reviews?: number;
}

/** Capa horizontal padrão dos jogos da Steam. */
const buildCapaUrl = (appid: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

/** Rótulos em português para o review_score (1 a 9) da Steam. */
const ROTULOS_AVALIACAO: Record<number, string> = {
  1: 'Extremamente negativas',
  2: 'Muito negativas',
  3: 'Negativas',
  4: 'Ligeiramente negativas',
  5: 'Mistas',
  6: 'Ligeiramente positivas',
  7: 'Positivas',
  8: 'Muito positivas',
  9: 'Extremamente positivas'
};

/**
 * A busca da Steam devolve trilhas sonoras e extras como "app".
 * Este filtro tira do autocomplete os itens claramente que não são jogos.
 */
const PARECE_EXTRA =
  /\b(soundtrack|trilha sonora|ost|original score|artbook|art book|season pass|playtest|demo)\b/i;

const chaveApiSteam = (): string => {
  const apiKey = process.env.STEAM_API_KEY?.trim();
  if (!apiKey) {
    throw new AppError(
      503,
      'Consulta de biblioteca indisponível: configure a variável STEAM_API_KEY no arquivo .env.'
    );
  }
  return apiKey;
};

/** Requisição JSON com timeout padronizado. */
async function buscarJson<T>(url: URL): Promise<T> {
  const resposta = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/json' }
  });

  if (!resposta.ok) {
    throw new AppError(502, 'A Steam retornou uma resposta inválida. Tente novamente.');
  }

  return (await resposta.json()) as T;
}

/**
 * GET /api/steam/search?q=termo
 * Proxy para a busca do catálogo da Steam (não exige conta Steam nem API key).
 */
export const searchSteamGames = async (req: Request, res: Response, next: NextFunction) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!query) {
    return res.json([]);
  }

  try {
    const games = await comCache(`busca:${query.toLowerCase()}`, TTL_BUSCA_MS, async () => {
      const url = new URL(STEAM_SEARCH_URL);
      url.searchParams.set('term', query);
      url.searchParams.set('l', 'portuguese');
      url.searchParams.set('cc', 'BR');

      const data = await buscarJson<{ items?: SteamStoreItem[] }>(url);

      return (data.items ?? [])
        .filter(
          (item) =>
            Number.isInteger(item?.id) &&
            typeof item?.name === 'string' &&
            (!item?.type || item.type === 'app') &&
            !PARECE_EXTRA.test(item.name as string)
        )
        .map((item) => ({
          steam_appid: item.id as number,
          titulo: (item.name as string).trim(),
          capa_url: buildCapaUrl(item.id as number)
        }));
    });

    return res.json(games);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(502, 'Não foi possível consultar o catálogo da Steam agora.'));
  }
};

interface DetalhesJogo {
  steam_appid: number;
  titulo: string;
  capa_url: string;
  tipo: string | null;
  data_lancamento: string | null;
  desenvolvedor: string | null;
  publicadora: string | null;
  genero: string | null;
  descricao_curta: string | null;
  gratuito: boolean;
  url_loja: string;
  preco: string | null;
  preco_original: string | null;
  desconto_percentual: number;
  avaliacao: {
    descricao: string;
    positivas: number;
    negativas: number;
    total: number;
    percentual: number | null;
  } | null;
}

/** Busca metadados + resumo de avaliações na loja da Steam. */
async function obterDetalhesJogo(appid: number): Promise<DetalhesJogo> {
  const urlDetalhes = new URL(STEAM_APP_DETAILS_URL);
  urlDetalhes.searchParams.set('appids', String(appid));
  urlDetalhes.searchParams.set('l', 'portuguese');
  urlDetalhes.searchParams.set('cc', 'BR');

  const urlAvaliacoes = new URL(STEAM_APP_REVIEWS_URL);
  urlAvaliacoes.searchParams.set('appid', String(appid));
  urlAvaliacoes.searchParams.set(
    'input_json',
    JSON.stringify({
      languages: ['all'],
      num_per_page: 1,
      // 1 = todas as compras; 0 = todas as reviews.
      purchase_type: 1,
      review_type: 0,
      filter: 0,
      display_language: 'portuguese'
    })
  );

  const [respostaDetalhes, respostaAvaliacoes] = await Promise.allSettled([
    buscarJson<Record<string, { success?: boolean; data?: AppDetailsData }>>(urlDetalhes),
    buscarJson<{ response?: { query_summary?: ReviewSummary } }>(urlAvaliacoes)
  ]);

  if (respostaDetalhes.status === 'rejected') {
    throw respostaDetalhes.reason;
  }

  const info = respostaDetalhes.value?.[String(appid)];

  if (!info?.success || !info.data) {
    throw new AppError(404, 'Jogo não encontrado no catálogo da Steam.');
  }

  const dados = info.data;

  let avaliacao: DetalhesJogo['avaliacao'] = null;

  if (respostaAvaliacoes.status === 'fulfilled') {
    const resumo = respostaAvaliacoes.value?.response?.query_summary;
    const total = Number(resumo?.total_reviews ?? 0);

    if (total > 0) {
      const positivas = Number(resumo?.total_positive ?? 0);
      const negativas = Number(resumo?.total_negative ?? 0);
      avaliacao = {
        descricao:
          resumo?.review_score_desc ||
          ROTULOS_AVALIACAO[Number(resumo?.review_score)] ||
          'Sem classificação',
        positivas,
        negativas,
        total,
        percentual: Math.round((positivas / total) * 100)
      };
    }
  }

  const dataLancamento =
    typeof dados.release_date?.date === 'string' && dados.release_date.date.trim() !== ''
      ? dados.release_date.date.trim()
      : null;

  return {
    steam_appid: appid,
    titulo: dados.name?.trim() || `App ${appid}`,
    capa_url: dados.header_image || buildCapaUrl(appid),
    tipo: dados.type ?? null,
    data_lancamento: dataLancamento,
    desenvolvedor: dados.developers?.filter(Boolean).join(', ') || null,
    publicadora: dados.publishers?.filter(Boolean).join(', ') || null,
    genero: dados.genres?.map((genero) => genero.description).filter(Boolean).join(', ') || null,
    descricao_curta: dados.short_description?.trim() || null,
    gratuito: Boolean(dados.is_free),
    url_loja: `https://store.steampowered.com/app/${appid}/`,
    preco: dados.is_free ? 'Grátis' : dados.price_overview?.final_formatted || null,
    preco_original:
      !dados.is_free && dados.price_overview?.initial_formatted
        ? dados.price_overview.initial_formatted
        : null,
    desconto_percentual: Number(dados.price_overview?.discount_percent ?? 0),
    avaliacao
  };
}

/**
 * GET /api/steam/app/:appid
 * Metadados do jogo (nome, lançamento, desenvolvedor, gêneros e avaliações).
 */
export const getSteamAppDetails = async (req: Request, res: Response, next: NextFunction) => {
  const appid = Number(req.params.appid);

  if (!Number.isInteger(appid) || appid <= 0) {
    return next(new AppError(400, 'AppID inválido.'));
  }

  try {
    const detalhes = await comCache(`app:${appid}`, TTL_DETALHES_MS, () =>
      obterDetalhesJogo(appid)
    );
    return res.json(detalhes);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(502, 'Não foi possível consultar os detalhes do jogo na Steam agora.'));
  }
};

/**
 * Lê a biblioteca de um SteamID64 e devolve apenas jogos com horas jogadas.
 */
async function obterBiblioteca(steamId: string) {
  const url = new URL(STEAM_OWNED_GAMES_URL);
  url.searchParams.set('key', chaveApiSteam());
  url.searchParams.set('steamid', steamId);
  url.searchParams.set('include_appinfo', '1');
  url.searchParams.set('include_played_free_games', '1');
  url.searchParams.set('format', 'json');

  const data = await buscarJson<{
    response?: { games?: SteamOwnedGame[]; game_count?: number };
  }>(url);

  const games = data.response?.games ?? [];

  const jogos = games
    // O frontend exibe horas inteiras: não mostramos jogos que continuariam
    // aparecendo como 0h depois do arredondamento.
    .filter((game) => Math.round((game.playtime_forever ?? 0) / 60) > 0)
    .map((game) => ({
      steam_appid: game.appid,
      titulo: game.name ?? `App ${game.appid}`,
      capa_url: buildCapaUrl(game.appid),
      horas_jogadas: Math.round((game.playtime_forever ?? 0) / 60),
      ultimo_jogo_em: game.rtime_last_played
        ? formatarDataComFuso(new Date(game.rtime_last_played * 1000))
        : null
    }))
    .sort((a, b) => b.horas_jogadas - a.horas_jogadas);

  return {
    jogos,
    total_jogos: jogos.length,
    total_horas: jogos.reduce((soma, jogo) => soma + jogo.horas_jogadas, 0)
  };
}

/**
 * GET /api/steam/biblioteca
 * Biblioteca do usuário logado. Ignora jogos com 0 horas e exige conta vinculada.
 */
export const getMinhaBiblioteca = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = req.usuario;
    if (!usuario) throw new AppError(401, 'Faça login para ver sua biblioteca.');
    if (!usuario.steam_id) {
      throw new AppError(400, 'Vincule sua conta Steam para carregar a biblioteca.');
    }

    const biblioteca = await comCache(
      `biblioteca:${usuario.steam_id}`,
      TTL_BIBLIOTECA_MS,
      () => obterBiblioteca(usuario.steam_id as string)
    );

    return res.json({
      steam_id: usuario.steam_id,
      steam_nome: usuario.steam_nome,
      avatar_url: usuario.avatar_url,
      ...biblioteca
    });
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(502, 'Não foi possível consultar a biblioteca da Steam agora.'));
  }
};

/**
 * GET /api/steam/user-games/:steamId
 * Consulta pública de biblioteca por SteamID64 (mantida para compatibilidade).
 */
export const getUserGames = async (req: Request, res: Response, next: NextFunction) => {
  const steamId = typeof req.params.steamId === 'string' ? req.params.steamId.trim() : '';

  if (!/^\d{17}$/.test(steamId)) {
    return next(new AppError(400, 'SteamID inválida. Informe um SteamID64 com 17 dígitos.'));
  }

  try {
    const biblioteca = await comCache(`biblioteca:${steamId}`, TTL_BIBLIOTECA_MS, () =>
      obterBiblioteca(steamId)
    );

    if (biblioteca.jogos.length === 0) {
      return next(
        new AppError(
          404,
          'Nenhum jogo com horas jogadas encontrado. Verifique se o perfil está público e se o SteamID está correto.'
        )
      );
    }

    return res.json(biblioteca.jogos);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(502, 'Não foi possível consultar a biblioteca da Steam agora.'));
  }
};
