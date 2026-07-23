import pg from 'pg';
import { logger } from '../lib/logger';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const dbAvailable = true;

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on PostgreSQL idle client');
});

/** Run a parameterized query and return all rows */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}

/** Run a parameterized query and return first row or null */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run a write query (INSERT/UPDATE/DELETE) */
export async function execute(sql: string, params?: any[]): Promise<pg.QueryResult> {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
