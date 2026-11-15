import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config({ override: true });

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
  // TiDB Cloud roda em UTC; sem isso o mysql2 interpreta os TIMESTAMP como
  // horário local (UTC-3) e desloca created_at/updated_at em 3 horas.
  timezone: 'Z',
  ssl: {
    minVersion: 'TLSv1.2',
    ...(sslCaPath ? { ca: readFileSync(sslCaPath) } : {})
  }
});
