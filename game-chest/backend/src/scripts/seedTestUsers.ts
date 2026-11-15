import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

dotenv.config({ override: true });

const contas = [
  ['Ana Pixel', 'ana.pixel@teste.gamechest.local', 'Hades', 5, 'Um roguelike rápido, elegante e impossível de largar.'],
  ['Bruno do Controle', 'bruno.controle@teste.gamechest.local', 'Elden Ring', 5, 'Exploração e descoberta em uma escala absurda.'],
  ['Carol Indie', 'carol.indie@teste.gamechest.local', 'Celeste', 5, 'Desafio preciso com uma história muito humana.'],
  ['Diego Coop', 'diego.coop@teste.gamechest.local', 'It Takes Two', 4, 'Uma aventura cooperativa criativa do começo ao fim.'],
  ['Elisa RPG', 'elisa.rpg@teste.gamechest.local', 'Baldur’s Gate 3', 5, 'Liberdade de escolha em cada conversa e combate.'],
  ['Felipe Retrô', 'felipe.retro@teste.gamechest.local', 'Sonic Mania', 4, 'Uma homenagem retrô que entende exatamente seu material.'],
  ['Gi Lima', 'gi.lima@teste.gamechest.local', 'Stardew Valley', 5, 'Confortável, generoso e cheio de pequenas histórias.'],
  ['Hugo FPS', 'hugo.fps@teste.gamechest.local', 'DOOM Eternal', 4, 'Ação veloz que recompensa agressividade e domínio.'],
  ['Iara Narrativa', 'iara.narrativa@teste.gamechest.local', 'Disco Elysium', 5, 'Texto, personagens e escolhas em um nível raro.'],
  ['João Sandbox', 'joao.sandbox@teste.gamechest.local', 'Minecraft', 4, 'Um espaço para criar histórias por centenas de horas.']
] as const;

const appids: Record<string, number> = {
  Hades: 1145360,
  'Elden Ring': 1245620,
  Celeste: 504230,
  'It Takes Two': 1426210,
  'Baldur’s Gate 3': 1086940,
  'Sonic Mania': 584400,
  'Stardew Valley': 413150,
  'DOOM Eternal': 782330,
  'Disco Elysium': 632470,
  Minecraft: 1672970
};

const capa = (appid: number) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

async function main() {
  const senhaHash = await bcrypt.hash('Teste123!', 10);
  let criados = 0;
  let reviewsCriadas = 0;

  for (const [nome, email, titulo, nota, texto] of contas) {
    const [existentes] = await pool.query<RowDataPacket[]>('SELECT id FROM usuarios WHERE email = ?', [email]);
    let usuarioId: number;

    if (existentes.length > 0) {
      usuarioId = Number(existentes[0].id);
    } else {
      const [resultado] = await pool.query<ResultSetHeader>(
        'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
        [nome, email, senhaHash]
      );
      usuarioId = resultado.insertId;
      criados += 1;
    }

    const appid = appids[titulo];
    await pool.query(
      `INSERT INTO jogos (steam_appid, titulo, capa_url)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), capa_url = VALUES(capa_url)`,
      [appid, titulo, capa(appid)]
    );

    const [jogos] = await pool.query<RowDataPacket[]>('SELECT id FROM jogos WHERE steam_appid = ?', [appid]);
    const [reviews] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE usuario_id = ? AND jogo_id = ?',
      [usuarioId, jogos[0].id]
    );

    if (reviews.length === 0) {
      await pool.query(
        `INSERT INTO reviews (usuario_id, usuario, jogo_id, horas_jogadas, status, nota, texto_review)
         VALUES (?, ?, ?, ?, 'Zerado', ?, ?)`,
        [usuarioId, nome, jogos[0].id, 12 + (usuarioId % 40), nota, texto]
      );
      reviewsCriadas += 1;
    }
  }

  console.log(`Seed concluído: ${criados} contas criadas e ${reviewsCriadas} reviews criadas.`);
  console.log('Login de teste: qualquer e-mail acima com a senha Teste123!');
}

main()
  .catch((erro) => {
    console.error('Falha no seed:', erro?.message ?? erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
