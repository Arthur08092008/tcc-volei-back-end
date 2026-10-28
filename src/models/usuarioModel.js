
const pool = require('../config/database');

// =========================
// BUSCAR USUÁRIO PELO E-MAIL
// =========================
async function buscarPorEmail(email) {
  const resultado = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email]
  );

  return resultado.rows[0];
}

// =========================
// CRIAR USUÁRIO
// =========================
async function criar({ nome, email, senhaHash }) {
  const resultado = await pool.query(
    `INSERT INTO usuarios (nome, email, senha)
     VALUES ($1, $2, $3)
     RETURNING id, nome, email, criado_em`,
    [nome, email, senhaHash]
  );

  return resultado.rows[0];
}

// =========================
// RECUPERAÇÃO DE SENHA
// =========================

// Salvar o hash do token com validade de uma hora.
async function salvarTokenReset(id, tokenHash) {
  await pool.query(
    `UPDATE usuarios
     SET reset_token = $1,
         reset_expira = NOW() + INTERVAL '1 hour'
     WHERE id = $2`,
    [tokenHash, id]
  );
}

// Buscar usuário somente se o token existir e não estiver expirado.
async function buscarPorTokenReset(tokenHash) {
  const resultado = await pool.query(
    `SELECT id, nome, email
     FROM usuarios
     WHERE reset_token = $1
       AND reset_expira > NOW()`,
    [tokenHash]
  );

  return resultado.rows[0];
}

// Trocar a senha e invalidar o token utilizado.
async function atualizarSenha(id, senhaHash) {
  await pool.query(
    `UPDATE usuarios
     SET senha = $1,
         reset_token = NULL,
         reset_expira = NULL
     WHERE id = $2`,
    [senhaHash, id]
  );
}

// Limpar o token se o envio do e-mail falhar.
async function limparTokenReset(id) {
  await pool.query(
    `UPDATE usuarios
     SET reset_token = NULL,
         reset_expira = NULL
     WHERE id = $1`,
    [id]
  );
}

// =========================
// EXPORTAR FUNÇÕES
// =========================
module.exports = {
  buscarPorEmail,
  criar,
  salvarTokenReset,
  buscarPorTokenReset,
  atualizarSenha,
  limparTokenReset
};