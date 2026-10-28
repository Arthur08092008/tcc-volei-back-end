// backend/src/routes/campeonatos.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db'); // conexão pg (Pool) já configurada no projeto

/*
 * Descobre o id do usuário a partir do token JWT enviado no cabeçalho
 *   Authorization: Bearer <token>
 *
 * Retorna null se não houver token ou se ele for inválido.
 * AJUSTE: se no seu login o id vai no token com outro nome,
 * inclua esse nome na lista abaixo (veja o jwt.sign no authRoutes.js).
 */
function obterUsuarioId(req) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (!token) return null;

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    const id = dados.id ?? dados.userId ?? dados.usuario_id ?? dados.sub ?? null;
    return id !== null ? Number(id) : null;
  } catch (erro) {
    return null;
  }
}

// GET /campeonatos
// Públicos: aparecem para todos.
// Privados: aparecem só para quem criou.
router.get('/', async (req, res) => {
  const usuarioId = obterUsuarioId(req);

  try {
    const resultado = await db.query(
      `SELECT *,
              ($1::int IS NOT NULL AND criador_id = $1::int) AS eh_meu
         FROM campeonatos
        WHERE publico = true
           OR ($1::int IS NOT NULL AND criador_id = $1::int)
        ORDER BY data_inicio DESC`,
      [usuarioId]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar campeonatos' });
  }
});

// POST /campeonatos - cria um novo campeonato (precisa estar logado)
router.post('/', async (req, res) => {
  const usuarioId = obterUsuarioId(req);

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não identificado. Faça login novamente.' });
  }

  const {
    nome, data_inicio, data_fim, formato, max_equipes,
    status, regulamento, publico
  } = req.body;

  if (!nome || !data_inicio || !data_fim || !formato || !max_equipes) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO campeonatos
         (nome, data_inicio, data_fim, formato, max_equipes, status, regulamento, publico, criador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nome, data_inicio, data_fim, formato, max_equipes,
        status || 'planejado',
        regulamento || null,
        publico !== false, // se não vier nada, fica público
        usuarioId          // vem do token, não do corpo da requisição
      ]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar campeonato' });
  }
});

// DELETE /campeonatos/:id - só quem criou pode excluir
router.delete('/:id', async (req, res) => {
  const usuarioId = obterUsuarioId(req);

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não identificado. Faça login novamente.' });
  }

  try {
    const resultado = await db.query(
      'DELETE FROM campeonatos WHERE id = $1 AND criador_id = $2',
      [req.params.id, usuarioId]
    );

    if (resultado.rowCount === 0) {
      return res.status(403).json({ erro: 'Você não pode excluir este campeonato' });
    }

    res.status(204).send();
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao excluir campeonato' });
  }
});

module.exports = router;