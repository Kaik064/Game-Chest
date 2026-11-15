/**
 * Migração idempotente da Fase 5 (contas + vínculo Steam + metadados de jogos).
 *
 * Uso: npm run db:migrate
 * Pode rodar quantas vezes quiser: cada passo confere o estado antes de alterar.
 */
import dotenv from 'dotenv';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/database';

dotenv.config({ override: true });

async function colunaExiste(tabela: string, coluna: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tabela, coluna]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function indiceExiste(tabela: string, indice: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tabela, indice]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function constraintExiste(nome: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE() AND constraint_name = ?`,
    [nome]
  );
  return Number(rows[0]?.total ?? 0) > 0;
}

async function adicionarColuna(tabela: string, coluna: string, definicao: string) {
  if (await colunaExiste(tabela, coluna)) {
    console.log(`= ${tabela}.${coluna} já existe`);
    return;
  }
  await pool.query(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  console.log(`+ ${tabela}.${coluna} criada`);
}

async function main() {
  console.log('Migração Fase 5 — contas, Steam e metadados\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      steam_id VARCHAR(17) NULL UNIQUE,
      steam_nome VARCHAR(100) NULL,
      avatar_url VARCHAR(512) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('= usuarios pronta');

  // Metadados de catálogo (preenchidos ao escolher o jogo na Steam).
  await adicionarColuna('jogos', 'data_lancamento', 'VARCHAR(40) NULL');
  await adicionarColuna('jogos', 'desenvolvedor', 'VARCHAR(255) NULL');
  await adicionarColuna('jogos', 'genero', 'VARCHAR(255) NULL');
  await adicionarColuna('jogos', 'avaliacao_steam', 'VARCHAR(120) NULL');
  await adicionarColuna('jogos', 'avaliacao_percentual', 'TINYINT UNSIGNED NULL');
  await adicionarColuna('jogos', 'avaliacao_total', 'INT UNSIGNED NULL');

  // Dono da review. O nome em reviews.usuario continua como snapshot de exibição.
  await adicionarColuna('reviews', 'usuario_id', 'INT NULL');

  if (!(await indiceExiste('reviews', 'idx_reviews_usuario'))) {
    await pool.query('ALTER TABLE reviews ADD INDEX idx_reviews_usuario (usuario_id)');
    console.log('+ índice idx_reviews_usuario criado');
  } else {
    console.log('= índice idx_reviews_usuario já existe');
  }

  if (!(await constraintExiste('fk_reviews_usuario'))) {
    await pool.query(`
      ALTER TABLE reviews
      ADD CONSTRAINT fk_reviews_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    `);
    console.log('+ chave estrangeira fk_reviews_usuario criada');
  } else {
    console.log('= chave estrangeira fk_reviews_usuario já existe');
  }

  console.log('\nMigração concluída.');
}

main()
  .catch((erro) => {
    console.error('\nFalha na migração:', erro?.message ?? erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
