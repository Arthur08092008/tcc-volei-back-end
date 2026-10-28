// controllers/campeonatoController.js
const campeonatoModel = require('../models/campeonatoModel');

async function criar(req, res) {
  try {
    const campeonato = await campeonatoModel.criarCampeonato(req.body);
    res.status(201).json(campeonato);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar campeonato' });
  }
}

async function listar(req, res) {
  try {
    const campeonatos = await campeonatoModel.listarCampeonatos();
    res.json(campeonatos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar campeonatos' });
  }
}

async function buscarPorId(req, res) {
  try {
    const campeonato = await campeonatoModel.buscarCampeonatoPorId(req.params.id);
    if (!campeonato) {
      return res.status(404).json({ erro: 'Campeonato não encontrado' });
    }
    res.json(campeonato);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar campeonato' });
  }
}

async function excluir(req, res) {
  try {
    await campeonatoModel.excluirCampeonato(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir campeonato' });
  }
}

module.exports = { criar, listar, buscarPorId, excluir };