// Conexão com o PostgreSQL.
// Ajuste este caminho para o mesmo que o partidaController usa.
const db = require('../config/db');
const pool = db.pool || db;

const CATEGORIAS = ['Masculino', 'Feminino', 'Misto'];

function validar(body) {
  const nome = String(body.nome ?? '').trim();
  const cidade = String(body.cidade ?? '').trim();
  const categoria = body.categoria;

  if (!nome) return { erro: 'Informe o nome do time.' };
  if (!cidade) return { erro: 'Informe a cidade.' };
  if (!CATEGORIAS.includes(categoria)) {
    return { erro: 'Categoria inválida.' };
  }

  return { dados: { nome, cidade, categoria } };
}

// GET /times
async function listar(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, cidade, categoria
         FROM times
        ORDER BY nome ASC`
    );

    res.json(resultado.rows);
  } catch (e) {
    console.error('Erro ao listar times:', e);
    res.status(500).json({ mensagem: 'Erro ao listar os times.' });
  }
}

// POST /times
async function criar(req, res) {
  const { erro, dados } = validar(req.body);

  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO times (nome, cidade, categoria)
       VALUES ($1, $2, $3)
       RETURNING id, nome, cidade, categoria`,
      [dados.nome, dados.cidade, dados.categoria]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (e) {
    console.error('Erro ao criar time:', e);
    res.status(500).json({ mensagem: 'Erro ao criar o time.' });
  }
}

// PUT /times/:id
async function atualizar(req, res) {
  const id = Number(req.params.id);
  const { erro, dados } = validar(req.body);

  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  try {
    const resultado = await pool.query(
      `UPDATE times
          SET nome = $1, cidade = $2, categoria = $3
        WHERE id = $4
        RETURNING id, nome, cidade, categoria`,
      [dados.nome, dados.cidade, dados.categoria, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Time não encontrado.' });
    }

    res.json(resultado.rows[0]);
  } catch (e) {
    console.error('Erro ao atualizar time:', e);
    res.status(500).json({ mensagem: 'Erro ao atualizar o time.' });
  }
}

// DELETE /times/:id
async function excluir(req, res) {
  const id = Number(req.params.id);

  try {
    const resultado = await pool.query(
      'DELETE FROM times WHERE id = $1',
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Time não encontrado.' });
    }

    res.status(204).send();
  } catch (e) {
    console.error('Erro ao excluir time:', e);
    res.status(500).json({ mensagem: 'Erro ao excluir o time.' });
  }
}

module.exports = { listar, criar, atualizar, excluir };