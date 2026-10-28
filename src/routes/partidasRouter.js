// backend/src/routes/partidas.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // conexão pg (Pool) já configurada no projeto

/*
 * Colunas da tabela partidas:
 * id, time_a, time_b, data, horario, local, criado_em,
 * tipo, campeonato_id, categoria, modalidade
 */

// GET /partidas - lista as partidas (mais próximas primeiro)
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query(
      'SELECT * FROM partidas ORDER BY data ASC, horario ASC'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar partidas' });
  }
});

// POST /partidas - cria uma nova partida
router.post('/', async (req, res) => {
  const {
    time_a, time_b, data, horario, local,
    tipo, campeonato_id, categoria, modalidade
  } = req.body;

  if (!time_a || !time_b || !data || !horario || !local) {
    return res.status(400).json({
      erro: 'Preencha time A, time B, data, horário e local'
    });
  }

  if (time_a === time_b) {
    return res.status(400).json({ erro: 'Os dois times devem ser diferentes' });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO partidas
         (time_a, time_b, data, horario, local, tipo, campeonato_id, categoria, modalidade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        time_a, time_b, data, horario, local,
        tipo || null,
        campeonato_id || null,
        categoria || null,
        modalidade || null
      ]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar partida' });
  }
});

// PUT /partidas/:id - atualiza uma partida
router.put('/:id', async (req, res) => {
  const {
    time_a, time_b, data, horario, local,
    tipo, campeonato_id, categoria, modalidade
  } = req.body;

  if (!time_a || !time_b || !data || !horario || !local) {
    return res.status(400).json({
      erro: 'Preencha time A, time B, data, horário e local'
    });
  }

  try {
    const resultado = await db.query(
      `UPDATE partidas
          SET time_a = $1, time_b = $2, data = $3, horario = $4, local = $5,
              tipo = $6, campeonato_id = $7, categoria = $8, modalidade = $9
        WHERE id = $10
        RETURNING *`,
      [
        time_a, time_b, data, horario, local,
        tipo || null,
        campeonato_id || null,
        categoria || null,
        modalidade || null,
        req.params.id
      ]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Partida não encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar partida' });
  }
});

// DELETE /partidas/:id - exclui uma partida
router.delete('/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      'DELETE FROM partidas WHERE id = $1',
      [req.params.id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Partida não encontrada' });
    }

    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao excluir partida' });
  }
});

module.exports = router;