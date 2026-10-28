
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Listar todos os jogadores
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM jogador ORDER BY id'
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error('Erro ao listar jogadores:', erro);
    res.status(500).json({ erro: 'Erro ao buscar jogadores.' });
  }
});

// Buscar jogador por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const resultado = await pool.query(
      'SELECT * FROM jogador WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao buscar jogador:', erro);
    res.status(500).json({ erro: 'Erro ao buscar jogador.' });
  }
});

// Cadastrar jogador
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      data_nascimento,
      posicao,
      numero_camisa,
      altura,
      time
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    const resultado = await pool.query(
      `INSERT INTO jogador
       (nome, email, telefone, data_nascimento, posicao,
        numero_camisa, altura, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nome.trim(),
        email || null,
        telefone || null,
        data_nascimento || null,
        posicao || null,
        numero_camisa ?? null,
        altura ?? null,
        time || null
      ]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao cadastrar jogador:', erro);

    if (erro.code === '23505') {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado.'
      });
    }

    res.status(500).json({ erro: 'Erro ao cadastrar jogador.' });
  }
});

// Atualizar jogador
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const {
      nome,
      email,
      telefone,
      data_nascimento,
      posicao,
      numero_camisa,
      altura,
      time,
      status
    } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: 'O nome é obrigatório.' });
    }

    if (status !== undefined && !['Ativo', 'Inativo'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    const resultado = await pool.query(
      `UPDATE jogador SET
        nome = $1,
        email = $2,
        telefone = $3,
        data_nascimento = $4,
        posicao = $5,
        numero_camisa = $6,
        altura = $7,
        time = $8,
        status = COALESCE($9, status)
       WHERE id = $10
       RETURNING *`,
      [
        nome.trim(),
        email || null,
        telefone || null,
        data_nascimento || null,
        posicao || null,
        numero_camisa ?? null,
        altura ?? null,
        time || null,
        status ?? null,
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao atualizar jogador:', erro);

    if (erro.code === '23505') {
      return res.status(409).json({
        erro: 'Este e-mail já está cadastrado.'
      });
    }

    res.status(500).json({ erro: 'Erro ao atualizar jogador.' });
  }
});

// Excluir jogador
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const resultado = await pool.query(
      'DELETE FROM jogador WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Jogador não encontrado.' });
    }

    res.json({ mensagem: 'Jogador excluído com sucesso.' });
  } catch (erro) {
    console.error('Erro ao excluir jogador:', erro);
    res.status(500).json({ erro: 'Erro ao excluir jogador.' });
  }
});

module.exports = router;