import { pool } from "../../lib/db"; // conexão com PostgreSQL

export default async function userHandler(req, res) {
  try {
    // Consultar a tabela users em vez de usuarios
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao consultar usuários:', error);
    res.status(500).json({ error: 'Erro ao consultar usuários' });
  }
}