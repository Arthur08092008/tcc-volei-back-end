// controllers/checklistController.js
const checklistModel = require('../models/checklistModel');

async function listarPorPartida(req, res) {
  try {
    const itens = await checklistModel.listarItensPorPartida(req.params.partidaId);
    res.json(itens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar checklist' });
  }
}

async function criar(req, res) {
  try {
    const { descricao } = req.body;
    if (!descricao) {
      return res.status(400).json({ erro: 'Descrição é obrigatória' });
    }
    const item = await checklistModel.criarItem(req.params.partidaId, descricao);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao adicionar item' });
  }
}

async function atualizar(req, res) {
  try {
    const item = await checklistModel.atualizarItem(req.params.id, req.body.concluido);
    if (!item) {
      return res.status(404).json({ erro: 'Item não encontrado' });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar item' });
  }
}

async function excluir(req, res) {
  try {
    await checklistModel.excluirItem(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir item' });
  }
}

module.exports = { listarPorPartida, criar, atualizar, excluir };