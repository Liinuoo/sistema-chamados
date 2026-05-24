# 🚀 Guia Passo a Passo: Deploy no Render

## ✅ Antes de Começar

Você precisa ter:
1. Uma conta no **GitHub** (crie em github.com se não tiver)
2. Uma conta no **Render** (crie em render.com)
3. O código do projeto (que vou fornecer)

---

## 📝 PASSO 1: Preparar o Código no GitHub

### 1.1 Criar repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique em **New Repository**
3. Preencha:
   - **Repository name**: `sistema-chamados` (ou outro nome)
   - **Description**: "Sistema de rastreamento de chamados do Implanta"
   - **Public** (para facilitar)
   - Clicar em **Create Repository**

### 1.2 Fazer upload do código

1. No seu computador, abra o terminal/PowerShell
2. Navegue até a pasta do projeto:
```bash
cd C:\Users\seu-usuario\Desktop\sistema-chamados
# ou onde você salvou o projeto
```

3. Execute os comandos:
```bash
git init
git add .
git commit -m "Initial commit - Sistema de Chamados"
git branch -M main
git remote add origin https://github.com/seu-usuario/sistema-chamados.git
git push -u origin main
```

**Obs**: Substitua `seu-usuario` pelo seu login no GitHub.

---

## 🗄️ PASSO 2: Criar PostgreSQL no Render

### 2.1 Criar banco de dados

1. Acesse [render.com](https://render.com) e faça login
2. Na dashboard, clique em **New** → **PostgreSQL**
3. Preencha:
   - **Name**: `chamados-implanta-db`
   - **Database**: `chamados_implanta`
   - **User**: `andre_user` (você escolhe)
   - **Region**: `São Paulo` (mais próximo)
   - **PostgreSQL Version**: 13+ (qualquer um)
   - **Pricing Plan**: **Free** (para começar)

4. Clique em **Create Database**

### 2.2 Salvar informações do banco

Após criar, você receberá algo como:
```
External Database URL: 
postgresql://usuario:senha@host.c.db.onrender.com:5432/chamados_implanta
```

**SALVE ISSO EM UM LUGAR SEGURO!** (você usará depois)

### 2.3 Executar o script SQL

1. No Render, vá para o banco criado
2. Clique em **Connections** ou **Info**
3. Você verá um comando como:
```bash
PGPASSWORD=sua_senha psql -U usuario -h host.c.db.onrender.com -d chamados_implanta
```

4. **Opção A (Mais fácil)**: Usar o DBeaver
   - Baixe e instale [DBeaver](https://dbeaver.io)
   - Crie uma conexão PostgreSQL com os dados do Render
   - Abra o arquivo `database.sql` e execute

5. **Opção B (Terminal)**
   - Abra PowerShell/Terminal
   - Execute o comando do Render para conectar
   - Copie o conteúdo de `database.sql` e execute tudo

⚠️ **IMPORTANTE**: Você precisa executar o `database.sql` para criar as tabelas no banco remoto!

---

## 🌐 PASSO 3: Deploy no Render (Web Service)

### 3.1 Criar Web Service

1. No Render, clique em **New** → **Web Service**
2. Selecione **Connect a Repository**
3. Autorize o Render a acessar seu GitHub (primeira vez)
4. Selecione o repositório `sistema-chamados`

### 3.2 Configurar o serviço

1. Preencha:
   - **Name**: `sistema-chamados` (ou outro nome)
   - **Environment**: **Node**
   - **Region**: **São Paulo**
   - **Branch**: **main**
   
2. Desça até **Build Command**:
```
npm install
```

3. **Start Command**:
```
npm start
```

4. **Plan**: **Free** (gratuito)

### 3.3 Adicionar variáveis de ambiente

Ainda no formulário, procure por **Environment Variables**:

Clique em **Add Environment Variable**:

1. **DATABASE_URL**
   - Value: `postgresql://usuario:senha@host.c.db.onrender.com:5432/chamados_implanta`
   - (Use a URL que salvou no Passo 2.2)

2. **NODE_ENV**
   - Value: `production`

3. **SECRET_KEY**
   - Value: `uma_chave_muito_secreta_use_algo_aleatorio_123456789`

4. **PORT**
   - Value: `3000`

### 3.4 Fazer deploy

1. Clique em **Create Web Service**
2. **Aguarde 3-5 minutos** enquanto o Render faz o build e deploy
3. Você verá a URL da aplicação no topo (algo como: `https://sistema-chamados.onrender.com`)

---

## ✨ PASSO 4: Testar a Aplicação

1. Abra a URL fornecida pelo Render no navegador
2. Você verá a tela de login
3. Use as credenciais padrão:
   - **Usuário**: `admin`
   - **Senha**: `admin123`

4. Teste as funcionalidades:
   - Criar novo chamado
   - Visualizar chamados
   - Editar chamado
   - Gerar relatório

---

## 🔑 Importante: Mudar Senha Padrão

1. Após fazer login, você pode adicionar novos usuários editando o banco
2. Mudar senha do usuário `admin`:

**Via DBeaver**:
```sql
UPDATE usuarios 
SET senha = '$2a$10$NewHashedPasswordHere' 
WHERE usuario = 'admin';
```

Para gerar um hash da nova senha, você pode usar uma ferramenta online ou em Node.js:
```javascript
const bcrypt = require('bcryptjs');
const novoHash = bcrypt.hashSync('sua_nova_senha', 10);
console.log(novoHash);
```

---

## 🐛 Troubleshooting

### Erro: "Build failed"
- Verificar os logs no Render
- Confirmar se o `package.json` está no repositório
- Confirmar se o Node.js 16+ está especificado

### Erro: "Cannot connect to database"
- Verificar se a DATABASE_URL está correta
- Confirmar se o script SQL foi executado
- Testar conexão com DBeaver

### A aplicação carrega mas não funciona
- Verificar console do navegador (F12)
- Verificar logs no Render
- Confirmar se todas as tabelas foram criadas

### Quero resetar o banco de dados
- Deletar o banco no Render
- Criar um novo
- Executar o script SQL novamente

---

## 📱 Acessar de Qualquer Lugar

Depois de fazer deploy, você e seu coordenador podem acessar de:
- Computador da instituição
- Computador em casa
- Celular
- Tablet

É só acessar a URL: `https://seu-dominio.onrender.com`

---

## 🎉 Pronto!

Seu sistema está online e acessível! Agora você pode:

✅ Registrar chamados quando o Implanta tiver problemas
✅ Acompanhar o status de cada chamado
✅ Gerar relatórios mensais/trimestrais
✅ Compartilhar acesso com seu coordenador
✅ Acessar de qualquer lugar

---

## 📞 Dúvidas?

Se algo não funcionar:
1. Verificar os logs (no Render: Dashboard → seu serviço → Logs)
2. Tentar resetar o deploy
3. Conferir se as variáveis de ambiente estão corretas
4. Deletar o serviço e criar um novo do zero

**Boa sorte! 🚀**
