# Sistema de Rastreamento de Chamados - Implanta

Um sistema completo para registrar, acompanhar e gerar relatórios sobre chamados e falhas do sistema Implanta.

## 📋 Funcionalidades

### ✅ Módulo de Chamados
- Registro completo de chamados (abertura, motivo, resolução, data)
- Status (Aberto, Em Andamento, Resolvido, Cancelado)
- Prioridade (Baixa, Média, Alta, Crítica)
- Categorias de falhas (Bug, Performance, Erro de Dados, etc.)
- Responsável pelo atendimento
- Observações adicionais

### 📊 Módulo de Relatórios
- Relatórios por período (data inicial e final)
- Filtros avançados (status, prioridade, responsável, categoria)
- Estatísticas em tempo real:
  - Total de chamados
  - Taxa de resolução
  - Tempo médio de resolução
  - Chamados por categoria
- Dashboard com métricas principais

### 🔒 Segurança
- Sistema de login simples (usuário/senha)
- Autenticação baseada em token
- Senhas criptografadas com bcrypt

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deploy**: Render.com

## 📦 Instalação Local

### Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- Git

### Passos

1. **Clonar o projeto**
```bash
git clone seu-repo-aqui
cd sistema-chamados
```

2. **Instalar dependências**
```bash
npm install
```

3. **Configurar banco de dados**
```bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE chamados_implanta;"

# Executar script SQL
psql -U postgres -d chamados_implanta -f database.sql
```

4. **Configurar variáveis de ambiente**
Editar `.env`:
```
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/chamados_implanta
PORT=3000
NODE_ENV=development
SECRET_KEY=sua_chave_secreta_aqui
```

5. **Iniciar o servidor**
```bash
npm start
```

O sistema estará disponível em `http://localhost:3000`

## 🚀 Deploy no Render

### Passo 1: Preparar o GitHub
1. Criar um repositório no GitHub
2. Fazer push do código
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Passo 2: Criar PostgreSQL no Render
1. Acessar [render.com](https://render.com)
2. Clicar em **New PostgreSQL**
3. Preencher informações:
   - **Name**: `chamados-implanta-db`
   - **Database Name**: `chamados_implanta`
   - **User**: escolha um usuário
   - **Region**: escolha a região mais próxima
   - **Plan**: Free ou pago conforme necessidade

4. Salvar a **conexão string** fornecida

### Passo 3: Executar script SQL no Render
1. Após criar o banco, ir para **Connections**
2. Copiar a **PSQL Command** fornecida
3. Colar no terminal e conectar ao banco remoto
4. Executar o conteúdo do arquivo `database.sql`

Ou usar um cliente como DBeaver para conectar e executar o script.

### Passo 4: Criar Web Service no Render
1. Em [render.com](https://render.com), clicar em **New Web Service**
2. Selecionar o repositório GitHub
3. Preencher informações:
   - **Name**: `sistema-chamados`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free ou pago

4. Em **Environment Variables**, adicionar:
   ```
   DATABASE_URL=postgresql://seu_usuario:sua_senha@seu_host:5432/chamados_implanta
   NODE_ENV=production
   SECRET_KEY=uma_chave_secreta_muito_segura_123456789
   ```

5. Clicar em **Create Web Service**

### Passo 5: Testar
- Aguardar deploy (2-5 minutos)
- Acessar a URL fornecida pelo Render
- Fazer login com usuário: `admin` e senha padrão

## 🔑 Credenciais Padrão

- **Usuário**: admin
- **Senha**: admin123

⚠️ **IMPORTANTE**: Mude a senha após o primeiro login!

## 🗄️ Estrutura do Projeto

```
sistema-chamados/
├── server.js                  # Servidor Express principal
├── package.json              # Dependências do projeto
├── database.sql              # Script SQL para criar tabelas
├── .env                       # Variáveis de ambiente
├── public/
│   ├── index.html            # HTML principal
│   ├── styles.css            # Estilos CSS
│   └── app.js                # Lógica JavaScript
└── README.md                 # Este arquivo
```

## 📡 Rotas da API

### Autenticação
- `POST /api/login` - Fazer login

### Chamados
- `GET /api/chamados` - Listar chamados (com filtros)
- `GET /api/chamados/:id` - Obter chamado específico
- `POST /api/chamados` - Criar novo chamado
- `PUT /api/chamados/:id` - Atualizar chamado
- `DELETE /api/chamados/:id` - Deletar chamado

### Relatórios
- `GET /api/relatorio` - Gerar relatório geral
- `GET /api/relatorio/categoria` - Estatísticas por categoria

## 🐛 Troubleshooting

### Erro: "Database connection failed"
- Verificar se a string de conexão está correta em `.env`
- Confirmar se o PostgreSQL está rodando
- Verificar credenciais do banco

### Erro: "Cannot find module"
- Executar `npm install` novamente
- Deletar `node_modules` e `package-lock.json`
- Executar `npm install` de novo

### Erro 500 ao criar chamado
- Verificar logs do servidor
- Confirmar se as tabelas foram criadas no banco
- Validar formato dos dados enviados

## 📈 Melhorias Futuras

- [ ] Exportação de relatórios em PDF/Excel
- [ ] Integração com email para notificações
- [ ] Sistema de usuários com diferentes permissões
- [ ] Histórico de alterações de chamados
- [ ] Gráficos avançados com Chart.js
- [ ] Backup automático do banco de dados
- [ ] Aplicativo mobile
- [ ] Integração com sistema Implanta

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar conforme necessário.

---

**Desenvolvido com ❤️ para melhorar o controle de qualidade do Implanta**
