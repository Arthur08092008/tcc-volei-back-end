-- Execute este script no seu banco "voleitcc" antes de rodar o backend.
-- Ex: psql -U postgres -d voleitcc -f src/config/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Times e jogadores ja deixados preparados para as proximas telas do sistema
CREATE TABLE IF NOT EXISTS times (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jogadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    posicao VARCHAR(50),
    time_id INTEGER REFERENCES times(id) ON DELETE SET NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reset_expira TIMESTAMP;