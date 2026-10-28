// models/campeonatoModel.js
const pool = require('../config/db');

async function criarCampeonato({
  nome,
  data_inicio,
  data_fim,
  formato,
  max_equipes,
  status,
  regulamento
}) {
  const result = await pool.query(
    `INSERT INTO campeonatos
      (nome, data_inicio, data_fim, formato, max_equipes, status, regulamento)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      nome,
      data_inicio,
      data_fim,
      formato,
      max_equipes,
      status,
      regulamento
    ]
  );

  return result.rows[0];
}

async function listarCampeonatos() {
  const result = await pool.query(
    'SELECT * FROM campeonatos ORDER BY data_inicio DESC'
  );

  return result.rows;
}

async function buscarCampeonatoPorId(id) {
  const result = await pool.query(
    'SELECT * FROM campeonatos WHERE id = $1',
    [id]
  );

  return result.rows[0];
}

async function excluirCampeonato(id) {
  await pool.query(
    'DELETE FROM campeonatos WHERE id = $1',
    [id]
  );
}

module.exports = {
  criarCampeonato,
  listarCampeonatos,
  buscarCampeonatoPorId,
  excluirCampeonato
};