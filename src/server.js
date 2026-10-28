
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// ROTAS
// ==========================================

const authRoutes = require('./routes/authRoutes');
const timeRoutes = require('./routes/timeRoutes');
const campeonatoRoutes = require('./routes/campeonatos');
const partidasRoutes = require('./routes/partidasRouter');
const jogadoresRoutes = require('./routes/jogadores');

app.use('/auth', authRoutes);
app.use('/times', timeRoutes);
app.use('/campeonatos', campeonatoRoutes);
app.use('/partidas', partidasRoutes);
app.use('/jogadores', jogadoresRoutes);

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Conecta Vôlei funcionando!'
  });
});

// ==========================================
// SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
