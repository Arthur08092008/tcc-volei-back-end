
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

require('dotenv').config();

// Senha: mínimo de 8 caracteres, com maiúscula,
// minúscula, número e caractere especial.
const regexSenha =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;

const respostaPadrao = {
  mensagem:
    'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.'
};

function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =========================
// CADASTRO
// =========================
async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (
      typeof nome !== 'string' ||
      !nome.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof senha !== 'string' ||
      !senha
    ) {
      return res.status(400).json({
        mensagem: 'Nome, e-mail e senha são obrigatórios.'
      });
    }

    if (!regexSenha.test(senha)) {
      return res.status(400).json({
        mensagem:
          'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente =
      await usuarioModel.buscarPorEmail(emailNormalizado);

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: 'Este e-mail já está cadastrado.'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await usuarioModel.criar({
      nome: nome.trim(),
      email: emailNormalizado,
      senhaHash
    });

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso.',
      usuario
    });
  } catch (erro) {
    console.error('Erro no cadastro:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro interno do servidor.'
    });
  }
}

// =========================
// LOGIN
// =========================
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof senha !== 'string' ||
      !senha
    ) {
      return res.status(400).json({
        mensagem: 'E-mail e senha são obrigatórios.'
      });
    }

    const usuario = await usuarioModel.buscarPorEmail(
      email.trim().toLowerCase()
    );

    if (!usuario) {
      return res.status(401).json({
        mensagem: 'E-mail ou senha inválidos.'
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        mensagem: 'E-mail ou senha inválidos.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado.');

      return res.status(500).json({
        mensagem: 'Erro interno do servidor.'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (erro) {
    console.error('Erro no login:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro interno do servidor.'
    });
  }
}

// =========================
// ESQUECI A SENHA - BREVO
// =========================
async function esqueciSenha(req, res) {
  let usuarioId;

  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        mensagem: 'Informe o e-mail.'
      });
    }

    if (
      !process.env.BREVO_API_KEY ||
      !process.env.BREVO_SENDER_EMAIL ||
      !process.env.FRONT_URL
    ) {
      console.error('Configuração da Brevo incompleta.');

      return res.status(500).json({
        mensagem:
          'Serviço de recuperação temporariamente indisponível.'
      });
    }

    if (typeof fetch !== 'function') {
      console.error('Este Node.js não disponibiliza fetch.');

      return res.status(500).json({
        mensagem: 'Erro interno do servidor.'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuario =
      await usuarioModel.buscarPorEmail(emailNormalizado);

    // Não revela se o e-mail está cadastrado.
    if (!usuario) {
      return res.status(200).json(respostaPadrao);
    }

    usuarioId = usuario.id;

    // Token aleatório; somente o hash é salvo no banco.
    const token = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await usuarioModel.salvarTokenReset(usuario.id, tokenHash);

    const urlFrontend = process.env.FRONT_URL.replace(/\/+$/, '');
    const link = `${urlFrontend}/redefinir-senha/${token}`;
    const nomeSeguro = escaparHtml(usuario.nome || 'usuário');

    let respostaBrevo;

    try {
      respostaBrevo = await fetch(
        'https://api.brevo.com/v3/smtp/email',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': process.env.BREVO_API_KEY.trim(),
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: 'Conecta Vôlei',
              email: process.env.BREVO_SENDER_EMAIL.trim()
            },
            to: [
              {
                email: usuario.email,
                name: usuario.nome || 'Usuário'
              }
            ],
            subject: 'Redefinir senha - Conecta Vôlei',
            htmlContent: `
              <!DOCTYPE html>
              <html lang="pt-BR">
                <body style="font-family: Arial, sans-serif; color: #333;">
                  <h2>Redefinição de senha</h2>
                  <p>Olá, ${nomeSeguro}!</p>
                  <p>Recebemos uma solicitação para redefinir
                    a senha da sua conta Conecta Vôlei.</p>
                  <p>Este link expira em uma hora e só pode
                    ser utilizado uma vez.</p>
                  <p>
                    <a href="${link}"
                      style="display:inline-block;padding:12px 20px;
                      background:#2563eb;color:white;
                      text-decoration:none;border-radius:6px;">
                      Redefinir minha senha
                    </a>
                  </p>
                  <p>Se você não solicitou a alteração, ignore
                    esta mensagem.</p>
                </body>
              </html>
            `
          })
        }
      );
    } catch (erroEnvio) {
      // Não deixa token ativo se houver falha de conexão.
      await usuarioModel.limparTokenReset(usuario.id);

      console.error(
        'Erro de conexão com a Brevo:',
        erroEnvio.message
      );

      return res.status(502).json({
        mensagem:
          'Não foi possível enviar o e-mail agora. Tente novamente.'
      });
    }

    if (!respostaBrevo.ok) {
      // Registra status, sem imprimir chave, token ou link.
      const detalhe = await respostaBrevo.text();

      console.error(
        'Falha no Brevo:',
        respostaBrevo.status,
        detalhe
      );

      await usuarioModel.limparTokenReset(usuario.id);

      return res.status(502).json({
        mensagem:
          'Não foi possível enviar o e-mail agora. Tente novamente.'
      });
    }

    return res.status(200).json(respostaPadrao);
  } catch (erro) {
    console.error('Erro em esqueci-senha:', erro.message);

    // Limpa o token se uma etapa posterior ao salvamento falhar.
    if (usuarioId !== undefined) {
      try {
        await usuarioModel.limparTokenReset(usuarioId);
      } catch (erroLimpeza) {
        console.error(
          'Erro ao limpar token de recuperação:',
          erroLimpeza.message
        );
      }
    }

    return res.status(500).json({
      mensagem: 'Erro interno do servidor.'
    });
  }
}

// =========================
// REDEFINIR SENHA
// =========================
async function redefinirSenha(req, res) {
  try {
    const { token, senha } = req.body;

    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof senha !== 'string' ||
      !senha
    ) {
      return res.status(400).json({
        mensagem: 'Token e nova senha são obrigatórios.'
      });
    }

    if (!regexSenha.test(senha)) {
      return res.status(400).json({
        mensagem:
          'A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.'
      });
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const usuario =
      await usuarioModel.buscarPorTokenReset(tokenHash);

    if (!usuario) {
      return res.status(400).json({
        mensagem: 'Link inválido ou expirado.'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await usuarioModel.atualizarSenha(usuario.id, senhaHash);

    return res.status(200).json({
      mensagem: 'Senha alterada com sucesso.'
    });
  } catch (erro) {
    console.error('Erro em redefinir-senha:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro interno do servidor.'
    });
  }
}

module.exports = {
  cadastrar,
  login,
  esqueciSenha,
  redefinirSenha
};