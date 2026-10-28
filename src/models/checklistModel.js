// models/checklistModel.js
const pool = require('../config/db');

async function listarItensPorPartida(partidaId) {
  const result = await pool.query(
    `SELECT id, descricao, concluido FROM checklist_itens
     WHERE partida_id = $1 ORDER BY id`,
    [partidaId]
  );
  return result.rows;
}

async function criarItem(partidaId, descricao) {
  const result = await pool.query(
    `INSERT INTO checklist_itens (partida_id, descricao)
     VALUES ($1, $2) RETURNING *`,
    [partidaId, descricao]
  );
  return result.rows[0];
}

async function atualizarItem(id, concluido) {
  const result = await pool.query(
    `UPDATE checklist_itens SET concluido = $1 WHERE id = $2 RETURNING *`,
    [concluido, id]
  );
  return result.rows[0];
}

async function excluirItem(id) {
  await pool.query('DELETE FROM checklist_itens WHERE id = $1', [id]);
}

module.exports = {
  listarItensPorPartida,
  criarItem,
  atualizarItem,
  excluirItem,
};