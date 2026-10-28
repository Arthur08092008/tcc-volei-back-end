const express = require('express');

const router = express.Router();

const {
  cadastrar,
  login,
  esqueciSenha,
  redefinirSenha
} = require('../controllers/authControllers');

// Cadastro
router.post('/cadastro', cadastrar);

// Login
router.post('/login', login);

// Recuperação de senha
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);

module.exports = router;