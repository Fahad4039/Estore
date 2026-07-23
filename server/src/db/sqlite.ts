// Re-export PostgreSQL layer with the same interface for backwards compatibility
export { pool, dbAvailable, query, queryOne, execute } from './postgres';
