
require('dotenv').config();

const pool = require('./src/config/database');

async function testarBanco() {
  try {
    const resultado = await pool.query(`
      SELECT current_database() AS banco,
             current_user AS usuario,
             NOW() AS horario
    `);

    console.log('Conexão realizada com sucesso!');
    console.log(resultado.rows[0]);
  } catch (erro) {
    console.error('Falha na conexão:', erro.message);
  } finally {
    await pool.end();
  }
}

testarBanco();
