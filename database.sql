-- Criar banco de dados
CREATE DATABASE chamados_implanta;

-- Conectar ao banco
\c chamados_implanta;

-- Tabela de usuários
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de chamados
CREATE TABLE chamados (
  id SERIAL PRIMARY KEY,
  numero_chamado VARCHAR(20) UNIQUE NOT NULL,
  data_abertura TIMESTAMP NOT NULL,
  motivo TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  prioridade VARCHAR(20) NOT NULL DEFAULT 'Média',
  status VARCHAR(20) NOT NULL DEFAULT 'Aberto',
  responsavel VARCHAR(100),
  resolucao TEXT,
  data_resolucao TIMESTAMP,
  observacoes TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_chamados_status ON chamados(status);
CREATE INDEX idx_chamados_prioridade ON chamados(prioridade);
CREATE INDEX idx_chamados_categoria ON chamados(categoria);
CREATE INDEX idx_chamados_data_abertura ON chamados(data_abertura);

-- Usuário padrão (senha: admin123)
-- Para gerar um novo hash: node gerar-senha.js "suasenha"
INSERT INTO usuarios (usuario, senha, nome, email, role)
VALUES ('admin', '$2a$10$H5T.j9XpkP0R0/dDK3xpwOFrDJyHxE1K7H5T.j9XpkP0R0/dDK3xpw', 'Administrador', 'admin@implanta.com', 'admin');

-- ============ MIGRAÇÃO (banco já existente) ============
-- Execute estes comandos se o banco já estiver criado:
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
-- UPDATE usuarios SET role = 'admin' WHERE usuario = 'admin';
