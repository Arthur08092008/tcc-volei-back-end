
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('connect', () => {
  console.log('Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err.message);
});

// Salvar token de recuperação de senha
async function salvarTokenReset(id, tokenHash) {
  await pool.query(
    `UPDATE usuarios
     SET reset_token = $1,
         reset_expira = NOW() + INTERVAL '1 hour'
     WHERE id = $2`,
    [tokenHash, id]
  );
}

// Buscar usuário com token válido
async function buscarPorTokenReset(tokenHash) {
  const { rows } = await pool.query(
    `SELECT id, nome, email
     FROM usuarios
     WHERE reset_token = $1
       AND reset_expira > NOW()`,
    [tokenHash]
  );

  return rows[0] || null;
}

// Atualizar senha e invalidar token
async function atualizarSenha(id, senhaHash) {
  await pool.query(
    `UPDATE usuarios
     SET senha = $1,
         reset_token = NULL,
         reset_expira = NULL
     WHERE id = $2`,
    [senhaHash, id]
  );
}

// Exportar o pool e as funções de recuperação
module.exports = {
  pool,
  salvarTokenReset,
  buscarPorTokenReset,
  atualizarSenha
};