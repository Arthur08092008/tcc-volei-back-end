
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const pool = require("../config/db");
const {
  enviarEmailRedefinicao,
} = require("../config/email");
const router = express.Router();

// Solicitar redefinição de senha
router.post("/esqueci-senha", async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({
      mensagem: "Informe seu e-mail.",
    });
  }

  try {
    const resultado = await pool.query(
      "SELECT id, email FROM usuarios WHERE LOWER(email) = $1",
      [email]
    );

    // Não revela se o e-mail está cadastrado.
    if (resultado.rows.length === 0) {
      return res.json({
        mensagem:
          "Se o e-mail estiver cadastrado, você receberá as instruções.",
      });
    }

    const usuario = resultado.rows[0];

    // Token aleatório; somente o hash será armazenado.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.query(
      `UPDATE usuarios
       SET reset_token_hash = $1,
           reset_token_expira_em = NOW() + INTERVAL '30 minutes'
       WHERE id = $2`,
      [tokenHash, usuario.id]
    );

    const link =
      `${process.env.FRONTEND_URL}/redefinir-senha/${token}`;

    try {
      await enviarEmailRedefinicao(usuario.email, link);
    } catch (emailError) {
      // Remove o token se o envio falhar.
      await pool.query(
        `UPDATE usuarios
         SET reset_token_hash = NULL,
             reset_token_expira_em = NULL
         WHERE id = $1`,
        [usuario.id]
      );

      throw emailError;
    }

    return res.json({
      mensagem:
        "Se o e-mail estiver cadastrado, você receberá as instruções.",
    });
  } catch (erro) {
    console.error("Erro ao solicitar redefinição:", erro.message);

    return res.status(500).json({
      mensagem: "Não foi possível enviar o e-mail agora.",
    });
  }
});

// Salvar a nova senha
router.post("/redefinir-senha", async (req, res) => {
  const token = String(req.body.token || "");
  const novaSenha = String(req.body.novaSenha || "");

  if (!token || novaSenha.length < 8) {
    return res.status(400).json({
      mensagem:
        "Informe um link válido e uma senha com pelo menos 8 caracteres.",
    });
  }

  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resultado = await pool.query(
      `SELECT id
       FROM usuarios
       WHERE reset_token_hash = $1
         AND reset_token_expira_em > NOW()`,
      [tokenHash]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({
        mensagem:
          "O link é inválido ou expirou. Solicite outro e-mail.",
      });
    }

    const usuarioId = resultado.rows[0].id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    // A condição evita reutilizar um token já consumido.
    const atualizacao = await pool.query(
      `UPDATE usuarios
       SET senha = $1,
           reset_token_hash = NULL,
           reset_token_expira_em = NULL
       WHERE id = $2
         AND reset_token_hash = $3
         AND reset_token_expira_em > NOW()
       RETURNING id`,
      [senhaHash, usuarioId, tokenHash]
    );

    if (atualizacao.rowCount === 0) {
      return res.status(400).json({
        mensagem: "O link expirou ou já foi utilizado.",
      });
    }

    return res.json({
      mensagem:
        "Senha redefinida com sucesso! Você já pode entrar.",
    });
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro.message);

    return res.status(500).json({
      mensagem: "Não foi possível redefinir sua senha.",
    });
  }
});

module.exports = router;
