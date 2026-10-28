require('dotenv').config();
const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailPassword) {
    console.warn(
        "Configure EMAIL_USER e EMAIL_APP_PASSWORD no arquivo .env"
    );
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

async function enviarEmailRedefinicao(destinatario, link) {
    return transporter.sendMail({
        from: `"Conecta Vôlei" <${emailUser}>`,
        to: destinatario,
        subject: "Redefinição de senha - Conecta Vôlei",
        text: [
            "Olá!",
            "",
            "Recebemos uma solicitação para redefinir sua senha.",
            "Para cadastrar uma nova senha, acesse o link abaixo:",
            link,
            "",
            "O link expira em 30 minutos.",
            "Se você não solicitou essa alteração, ignore este e-mail.",
        ].join("\n"),
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h2 style="color: #1d4ed8;">Conecta Vôlei</h2>
              <p>Olá!</p>
              <p>Recebemos uma solicitação para redefinir sua senha.</p>
              <p>Para cadastrar uma nova senha, clique no botão abaixo:</p>
              <p style="margin: 28px 0;">
                <a href="${link}"
                   style="background:#1d4ed8;color:#fff;padding:14px 22px;
                   text-decoration:none;border-radius:8px;">
                   Redefinir minha senha
                </a>
              </p>
              <p>Este link expira em 30 minutos.</p>
              <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
            </div>
          `,
    });
}

module.exports = {
    transporter,
    enviarEmailRedefinicao,
};
