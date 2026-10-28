const pool = require('../config/db');

async function listarTodos() {
  const resultado = await pool.query(
    'SELECT * FROM times ORDER BY criado_em DESC'
  );
  return resultado.rows;
}

async function buscarPorId(id) {
  const resultado = await pool.query(
    'SELECT * FROM times WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
}

async function criar({ nome, cidade, categoria, tecnico, email, telefone }) {
  const resultado = await pool.query(
    `INSERT INTO times (nome, cidade, categoria, tecnico, email, telefone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nome, cidade, categoria, tecnico, email, telefone, criado_em`,
    [nome, cidade, categoria, tecnico, email, telefone]
  );
  return resultado.rows[0];
}

async function atualizar(id, { nome, cidade, categoria, tecnico, email, telefone }) {
  const resultado = await pool.query(
    `UPDATE times
     SET nome = $1, cidade = $2, categoria = $3, tecnico = $4, email = $5, telefone = $6
     WHERE id = $7
     RETURNING id, nome, cidade, categoria, tecnico, email, telefone, criado_em`,
    [nome, cidade, categoria, tecnico, email, telefone, id]
  );
  return resultado.rows[0];
}

async function excluir(id) {
  const resultado = await pool.query(
    'DELETE FROM times WHERE id = $1 RETURNING id',
    [id]
  );
  return resultado.rows[0];
}

module.exports = { listarTodos, buscarPorId, criar, atualizar, excluir };