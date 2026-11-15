/**
 * Formatação de datas no fuso do usuário.
 *
 * O banco (TiDB Cloud) armazena/retorna TIMESTAMP em UTC. A API converte para o
 * fuso configurado em APP_TIMEZONE e devolve um ISO 8601 COM offset, por exemplo
 * "2026-11-15T19:14:33-03:00". O instante continua exato e o front-end consegue
 * exibir a hora local sem cálculos manuais.
 */

const TIMEZONE_PADRAO = 'America/Sao_Paulo';

export const formatarDataComFuso = (
  valor: Date | string | null | undefined,
  timeZone: string = process.env.APP_TIMEZONE || TIMEZONE_PADRAO
): string | null => {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  let formatador: Intl.DateTimeFormat;
  try {
    formatador = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    // APP_TIMEZONE inválido: cai para o padrão em vez de derrubar a requisição.
    formatador = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE_PADRAO,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  const partes = formatador.formatToParts(data);
  const obter = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '00';

  const ano = obter('year');
  const mes = obter('month');
  const dia = obter('day');
  const hora = obter('hour');
  const minuto = obter('minute');
  const segundo = obter('second');

  // Descobre o offset comparando o horário local "desenhado" com o instante UTC.
  const comoUTC = Date.UTC(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo)
  );
  const offsetMinutos = Math.round((comoUTC - data.getTime()) / 60_000);
  const sinal = offsetMinutos >= 0 ? '+' : '-';
  const absoluto = Math.abs(offsetMinutos);
  const horas = String(Math.floor(absoluto / 60)).padStart(2, '0');
  const minutos = String(absoluto % 60).padStart(2, '0');
  const offset = `${sinal}${horas}:${minutos}`;

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}${offset}`;
};

/** Atalho para carimbo de tempo de respostas da API (health, erros). */
export const agoraComFuso = (): string => formatarDataComFuso(new Date()) as string;
