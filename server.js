import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verificar conexão com banco
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err);
});

// ============ MIDDLEWARE DE AUTENTICAÇÃO ============
function verificarSessao(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  
  try {
    // Aqui você pode validar o token se usar JWT
    req.usuarioId = token; // Simplificado por enquanto
    next();
  } catch (erro) {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

// ============ ROTAS DE AUTENTICAÇÃO ============

// Login
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'SELECT id, usuario, senha, nome FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    const user = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    // Aqui você pode gerar um JWT se preferir
    res.json({
      sucesso: true,
      token: user.id.toString(),
      usuario: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome
      }
    });
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// ============ ROTAS DE CHAMADOS ============

// Listar todos os chamados
app.get('/api/chamados', verificarSessao, async (req, res) => {
  try {
    const { status, prioridade, categoria, dataInicio, dataFim } = req.query;

    let query = 'SELECT * FROM chamados WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (prioridade) {
      query += ` AND prioridade = $${paramCount}`;
      params.push(prioridade);
      paramCount++;
    }

    if (categoria) {
      query += ` AND categoria = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }

    if (dataInicio) {
      query += ` AND data_abertura >= $${paramCount}`;
      params.push(dataInicio);
      paramCount++;
    }

    if (dataFim) {
      query += ` AND data_abertura <= $${paramCount}`;
      params.push(dataFim);
      paramCount++;
    }

    query += ' ORDER BY data_abertura DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (erro) {
    console.error('Erro ao listar chamados:', erro);
    res.status(500).json({ erro: 'Erro ao listar chamados' });
  }
});

// Obter um chamado específico
app.get('/api/chamados/:id', verificarSessao, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chamados WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao obter chamado:', erro);
    res.status(500).json({ erro: 'Erro ao obter chamado' });
  }
});

// Criar novo chamado
app.post('/api/chamados', verificarSessao, async (req, res) => {
  const { motivo, categoria, prioridade, responsavel, observacoes } = req.body;

  if (!motivo || !categoria || !prioridade) {
    return res.status(400).json({ erro: 'Motivo, categoria e prioridade são obrigatórios' });
  }

  try {
    // Gerar número do chamado
    const numeroChamado = `CH-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO chamados (numero_chamado, data_abertura, motivo, categoria, prioridade, responsavel, observacoes, usuario_id, status)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, 'Aberto')
       RETURNING *`,
      [numeroChamado, motivo, categoria, prioridade, responsavel || null, observacoes || null, req.usuarioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao criar chamado:', erro);
    res.status(500).json({ erro: 'Erro ao criar chamado' });
  }
});

// Atualizar chamado
app.put('/api/chamados/:id', verificarSessao, async (req, res) => {
  const { status, resolucao, responsavel, observacoes } = req.body;

  try {
    let query = 'UPDATE chamados SET atualizado_em = NOW()';
    const params = [];
    let paramCount = 2;

    if (status) {
      query += `, status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (resolucao) {
      query += `, resolucao = $${paramCount}`;
      params.push(resolucao);
      paramCount++;
    }

    if (status === 'Resolvido' && !resolucao) {
      return res.status(400).json({ erro: 'Resolução é obrigatória ao resolver um chamado' });
    }

    if (status === 'Resolvido') {
      query += `, data_resolucao = NOW()`;
    }

    if (responsavel) {
      query += `, responsavel = $${paramCount}`;
      params.push(responsavel);
      paramCount++;
    }

    if (observacoes !== undefined) {
      query += `, observacoes = $${paramCount}`;
      params.push(observacoes);
      paramCount++;
    }

    query += ` WHERE id = $1 RETURNING *`;
    params.unshift(req.params.id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao atualizar chamado:', erro);
    res.status(500).json({ erro: 'Erro ao atualizar chamado' });
  }
});

// Deletar chamado
app.delete('/api/chamados/:id', verificarSessao, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM chamados WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    res.json({ mensagem: 'Chamado deletado com sucesso' });
  } catch (erro) {
    console.error('Erro ao deletar chamado:', erro);
    res.status(500).json({ erro: 'Erro ao deletar chamado' });
  }
});

// ============ ROTAS DE RELATÓRIOS ============

// Gerar relatório
app.get('/api/relatorio', verificarSessao, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_chamados,
        COUNT(CASE WHEN status = 'Resolvido' THEN 1 END) as total_resolvidos,
        COUNT(CASE WHEN status = 'Aberto' THEN 1 END) as total_abertos,
        COUNT(CASE WHEN status = 'Em Andamento' THEN 1 END) as em_andamento,
        AVG(EXTRACT(EPOCH FROM (data_resolucao - data_abertura))/3600) as tempo_medio_resolucao_horas
      FROM chamados
      WHERE 1=1
    `;
    const params = [];

    if (dataInicio) {
      query += ` AND data_abertura >= $${params.length + 1}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ` AND data_abertura <= $${params.length + 1}`;
      params.push(dataFim);
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
});

// Estatísticas por categoria
app.get('/api/relatorio/categoria', verificarSessao, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        categoria,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Resolvido' THEN 1 END) as resolvidos
      FROM chamados
      GROUP BY categoria
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (erro) {
    console.error('Erro ao obter estatísticas:', erro);
    res.status(500).json({ erro: 'Erro ao obter estatísticas' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
