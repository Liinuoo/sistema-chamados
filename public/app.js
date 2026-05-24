// ============ CONFIGURAÇÃO INICIAL ============
const API_URL = '/api';
let token = null;
let usuarioLogado = null;

// Verificar se já está logado ao carregar
document.addEventListener('DOMContentLoaded', () => {
  const tokenSalvo = localStorage.getItem('token');
  const usuarioSalvo = localStorage.getItem('usuario');

  if (tokenSalvo && usuarioSalvo) {
    token = tokenSalvo;
    usuarioLogado = JSON.parse(usuarioSalvo);
    mostrarDashboard();
    carregarDados();
  }

  document.getElementById('formLogin').addEventListener('submit', fazerLogin);
  document.getElementById('btnLogout').addEventListener('click', fazerLogout);
  document.getElementById('formNovoChamado').addEventListener('submit', criarChamado);
  document.getElementById('formCriarUsuario').addEventListener('submit', criarUsuario);
  document.getElementById('formAlterarSenha').addEventListener('submit', alterarSenha);
});

// ============ AUTENTICAÇÃO ============
async function fazerLogin(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;
  const mensagemTroca = document.getElementById('mensagemTroca');

  mensagemTroca.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await response.json();

    if (!response.ok) {
      mensagemTroca.textContent = dados.erro || 'Usuário ou senha incorretos';
      mensagemTroca.style.display = 'block';
      return;
    }

    token = dados.token;
    usuarioLogado = dados.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado));

    mostrarDashboard();
    carregarDados();
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    mensagemTroca.textContent = 'Erro de conexão com o servidor';
    mensagemTroca.style.display = 'block';
  }
}

function fazerLogout() {
  token = null;
  usuarioLogado = null;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');

  document.getElementById('telalogin').style.display = 'flex';
  document.getElementById('teladashboard').style.display = 'none';
  document.getElementById('formLogin').reset();
  document.getElementById('mensagemTroca').style.display = 'none';
}

// ============ NAVEGAÇÃO ============
function mostrarDashboard() {
  document.getElementById('telalogin').style.display = 'none';
  document.getElementById('teladashboard').style.display = 'flex';
  document.getElementById('nomeUsuario').textContent = usuarioLogado.nome;

  const menuAdmin = document.getElementById('menuGerenciarUsuarios');
  menuAdmin.style.display = usuarioLogado.role === 'admin' ? 'block' : 'none';
}

function mostrarSecao(secao) {
  document.querySelectorAll('.secao').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

  document.getElementById(secao).classList.add('active');
  event.target.classList.add('active');

  if (secao === 'meus-chamados') {
    carregarChamados();
  } else if (secao === 'dashboard') {
    carregarDados();
  } else if (secao === 'gerenciar-usuarios') {
    carregarUsuarios();
  } else if (secao === 'alterar-senha') {
    document.getElementById('formAlterarSenha').reset();
    document.getElementById('msgAlterarSenha').style.display = 'none';
  } else if (secao === 'relatorio') {
    const dataFim = new Date();
    const dataInicio = new Date(dataFim.getTime() - 30 * 24 * 60 * 60 * 1000);
    document.getElementById('dataFim').valueAsDate = dataFim;
    document.getElementById('dataInicio').valueAsDate = dataInicio;
    gerarRelatorio();
  }
}

// ============ CHAMADAS À API ============
async function fazerRequisicao(url, opcoes = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...opcoes.headers
  };

  const response = await fetch(`${API_URL}${url}`, { ...opcoes, headers });

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }

  return response.json();
}

// ============ CHAMADOS ============
async function criarChamado(e) {
  e.preventDefault();

  const empresa = document.getElementById('empresa').value;
  const motivo = document.getElementById('motivo').value;
  const categoria = document.getElementById('categoria').value;
  const prioridade = document.getElementById('prioridade').value;
  const responsavel = document.getElementById('responsavel').value;
  const observacoes = document.getElementById('observacoes').value;

  try {
    await fazerRequisicao('/chamados', {
      method: 'POST',
      body: JSON.stringify({ empresa, motivo, categoria, prioridade, responsavel, observacoes })
    });

    const mensagem = document.getElementById('mensagemSucesso');
    mensagem.textContent = '✅ Chamado registrado com sucesso!';
    mensagem.style.display = 'block';

    document.getElementById('formNovoChamado').reset();

    setTimeout(() => { mensagem.style.display = 'none'; }, 3000);
  } catch (erro) {
    console.error('Erro ao criar chamado:', erro);
    alert('Erro ao registrar chamado');
  }
}

async function carregarChamados() {
  try {
    const status = document.getElementById('filtroStatus')?.value || '';
    const prioridade = document.getElementById('filtroPrioridade')?.value || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const empresa = document.getElementById('filtroEmpresa')?.value || '';

    let url = '/chamados?';
    if (status) url += `status=${status}&`;
    if (prioridade) url += `prioridade=${prioridade}&`;
    if (categoria) url += `categoria=${categoria}&`;
    if (empresa) url += `empresa=${empresa}`;

    const chamados = await fazerRequisicao(url);
    renderizarChamados(chamados);
  } catch (erro) {
    console.error('Erro ao carregar chamados:', erro);
  }
}

function renderizarChamados(chamados) {
  const listaChamados = document.getElementById('listaChamados');

  if (chamados.length === 0) {
    listaChamados.innerHTML = '<p style="text-align: center; color: #999;">Nenhum chamado encontrado</p>';
    return;
  }

  listaChamados.innerHTML = chamados.map(chamado => `
    <div class="chamado-card">
      <div class="chamado-header">
        <div class="chamado-numero">${chamado.numero_chamado}</div>
        <div class="chamado-badges">
          <span class="badge badge-status-${chamado.status.toLowerCase().replace(' ', '')}">${chamado.status}</span>
          <span class="badge badge-prioridade-${chamado.prioridade.toLowerCase()}">${chamado.prioridade}</span>
        </div>
      </div>

      <div class="chamado-info">
        <div class="chamado-info-item">
          <span class="chamado-info-label">Categoria</span>
          <span>${chamado.categoria}</span>
        </div>
        <div class="chamado-info-item">
          <span class="chamado-info-label">Data de Abertura</span>
          <span>${formatarData(chamado.data_abertura)}</span>
        </div>
        <div class="chamado-info-item">
          <span class="chamado-info-label">Responsável</span>
          <span>${chamado.responsavel || '-'}</span>
        </div>
        ${chamado.data_resolucao ? `
        <div class="chamado-info-item">
          <span class="chamado-info-label">Data de Resolução</span>
          <span>${formatarData(chamado.data_resolucao)}</span>
        </div>
        ` : ''}
      </div>

      <div class="chamado-motivo">
        <strong>Motivo:</strong><br>
        ${chamado.motivo}
      </div>

      ${chamado.resolucao ? `
      <div class="chamado-motivo">
        <strong>Resolução:</strong><br>
        ${chamado.resolucao}
      </div>
      ` : ''}

      <div class="chamado-acoes">
        <button class="btn btn-editar" onclick="abrirModal(${chamado.id}, '${chamado.status.replace(/'/g, "\\'")}', '${(chamado.resolucao || '').replace(/'/g, "\\'")}', '${(chamado.responsavel || '').replace(/'/g, "\\'")}', '${(chamado.observacoes || '').replace(/'/g, "\\'")}')">✏️ Editar</button>
        <button class="btn btn-deletar" onclick="deletarChamado(${chamado.id})">🗑️ Deletar</button>
      </div>
    </div>
  `).join('');
}

async function deletarChamado(id) {
  if (!confirm('Tem certeza que deseja deletar este chamado?')) return;

  try {
    await fazerRequisicao(`/chamados/${id}`, { method: 'DELETE' });
    carregarChamados();
  } catch (erro) {
    console.error('Erro ao deletar chamado:', erro);
    alert('Erro ao deletar chamado');
  }
}

// ============ MODAL DE EDIÇÃO ============
function abrirModal(id, status, resolucao, responsavel, observacoes) {
  document.getElementById('modalChamado').style.display = 'flex';
  document.getElementById('modalStatus').value = status;
  document.getElementById('modalResolucao').value = resolucao;
  document.getElementById('modalChamado').dataset.editarId = id;
}

function fecharModal() {
  document.getElementById('modalChamado').style.display = 'none';
}

async function salvarEdicaoChamado() {
  const id = document.getElementById('modalChamado').dataset.editarId;
  const status = document.getElementById('modalStatus').value;
  const resolucao = document.getElementById('modalResolucao').value;

  try {
    await fazerRequisicao(`/chamados/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolucao: resolucao || undefined })
    });

    fecharModal();
    carregarChamados();
    alert('Chamado atualizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao atualizar chamado:', erro);
    alert('Erro ao atualizar chamado');
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('modalChamado');
  if (event.target === modal) {
    fecharModal();
  }
}

// ============ RELATÓRIOS E ESTATÍSTICAS ============
async function carregarDados() {
  try {
    const relatorio = await fazerRequisicao('/relatorio');

    document.getElementById('totalChamados').textContent = relatorio.total_chamados || 0;
    document.getElementById('totalResolvidos').textContent = relatorio.total_resolvidos || 0;
    document.getElementById('totalAbertos').textContent = relatorio.total_abertos || 0;
    document.getElementById('totalAndamento').textContent = relatorio.em_andamento || 0;
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
  }
}

async function gerarRelatorio() {
  try {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;

    let url = '/relatorio?';
    if (dataInicio) url += `dataInicio=${dataInicio}&`;
    if (dataFim) url += `dataFim=${dataFim}`;

    const relatorio = await fazerRequisicao(url);

    document.getElementById('relatorioConteudo').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total de Chamados</h3>
          <div class="numero">${relatorio.total_chamados || 0}</div>
        </div>
        <div class="stat-card sucesso">
          <h3>Resolvidos</h3>
          <div class="numero sucesso">${relatorio.total_resolvidos || 0}</div>
        </div>
        <div class="stat-card alerta">
          <h3>Abertos</h3>
          <div class="numero alerta">${relatorio.total_abertos || 0}</div>
        </div>
        <div class="stat-card info">
          <h3>Em Andamento</h3>
          <div class="numero info">${relatorio.em_andamento || 0}</div>
        </div>
      </div>
    `;

    const estatisticas = await fazerRequisicao('/relatorio/categoria');
    renderizarEstatisticas(estatisticas);
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
  }
}

function renderizarEstatisticas(dados) {
  if (!dados.length) return;

  const html = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 1.5rem;">
      <thead>
        <tr style="background-color: #667eea; color: white;">
          <th style="padding: 0.75rem; text-align: left; border: 1px solid #ddd;">Categoria</th>
          <th style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">Total</th>
          <th style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">Resolvidos</th>
          <th style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">Taxa de Resolução</th>
        </tr>
      </thead>
      <tbody>
        ${dados.map(d => {
          const taxa = d.total > 0 ? ((d.resolvidos / d.total) * 100).toFixed(1) : 0;
          return `
            <tr>
              <td style="padding: 0.75rem; border: 1px solid #ddd;">${d.categoria}</td>
              <td style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">${d.total}</td>
              <td style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">${d.resolvidos}</td>
              <td style="padding: 0.75rem; text-align: center; border: 1px solid #ddd;">${taxa}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('relatorioConteudo').insertAdjacentHTML('beforeend', html);
}

// ============ GERENCIAR USUÁRIOS ============
async function carregarUsuarios() {
  try {
    const usuarios = await fazerRequisicao('/usuarios');
    renderizarUsuarios(usuarios);
  } catch (erro) {
    console.error('Erro ao carregar usuários:', erro);
    document.getElementById('listaUsuarios').innerHTML = '<p style="color: red;">Erro ao carregar usuários.</p>';
  }
}

function renderizarUsuarios(usuarios) {
  const lista = document.getElementById('listaUsuarios');

  if (usuarios.length === 0) {
    lista.innerHTML = '<p style="color: #999;">Nenhum usuário encontrado.</p>';
    return;
  }

  lista.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background-color: var(--primary); color: white;">
          <th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Nome</th>
          <th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Usuário</th>
          <th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Email</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Perfil</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${usuarios.map(u => `
          <tr>
            <td style="padding:0.75rem; border:1px solid #ddd;">${u.nome}</td>
            <td style="padding:0.75rem; border:1px solid #ddd;">${u.usuario}</td>
            <td style="padding:0.75rem; border:1px solid #ddd;">${u.email || '-'}</td>
            <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">
              <span style="padding:0.25rem 0.6rem; border-radius:4px; font-size:0.8rem; font-weight:bold;
                background:${u.role === 'admin' ? '#003d7a' : '#27ae60'}; color:white;">
                ${u.role === 'admin' ? 'Admin' : 'Usuário'}
              </span>
            </td>
            <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">
              ${u.id !== usuarioLogado.id ? `
                <button class="btn btn-deletar" style="font-size:0.8rem; padding:0.3rem 0.7rem;"
                  onclick="deletarUsuario(${u.id}, '${u.usuario}')">Deletar</button>
              ` : '<span style="color:#999; font-size:0.8rem;">Você</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function criarUsuario(e) {
  e.preventDefault();

  const nome = document.getElementById('novoNome').value.trim();
  const usuario = document.getElementById('novoUsuario').value.trim();
  const email = document.getElementById('novoEmail').value.trim();
  const role = document.getElementById('novoRole').value;
  const senha = document.getElementById('novaSenhaUsuario').value;
  const confirmar = document.getElementById('confirmarSenhaUsuario').value;
  const msg = document.getElementById('msgCriarUsuario');

  msg.style.display = 'none';

  if (senha !== confirmar) {
    msg.textContent = 'As senhas não coincidem.';
    msg.className = 'erro';
    msg.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, usuario, email, role, senha })
    });

    const dados = await response.json();

    if (!response.ok) {
      msg.textContent = dados.erro || 'Erro ao criar usuário.';
      msg.className = 'erro';
      msg.style.display = 'block';
      return;
    }

    msg.textContent = `Usuário "${usuario}" criado com sucesso!`;
    msg.className = 'sucesso';
    msg.style.display = 'block';
    document.getElementById('formCriarUsuario').reset();
    carregarUsuarios();
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
  } catch (erro) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className = 'erro';
    msg.style.display = 'block';
    console.error(erro);
  }
}

async function deletarUsuario(id, nomeUsuario) {
  if (!confirm(`Tem certeza que deseja deletar o usuário "${nomeUsuario}"?`)) return;

  try {
    await fazerRequisicao(`/usuarios/${id}`, { method: 'DELETE' });
    carregarUsuarios();
  } catch (erro) {
    alert('Erro ao deletar usuário.');
    console.error(erro);
  }
}

// ============ ALTERAR SENHA ============
async function alterarSenha(e) {
  e.preventDefault();

  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarNovaSenha').value;
  const msg = document.getElementById('msgAlterarSenha');

  msg.style.display = 'none';

  if (novaSenha !== confirmar) {
    msg.textContent = 'A nova senha e a confirmação não coincidem.';
    msg.className = 'erro';
    msg.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios/senha`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ senhaAtual, novaSenha })
    });

    const dados = await response.json();

    if (!response.ok) {
      msg.textContent = dados.erro || 'Erro ao alterar senha.';
      msg.className = 'erro';
      msg.style.display = 'block';
      return;
    }

    msg.textContent = 'Senha alterada com sucesso!';
    msg.className = 'sucesso';
    msg.style.display = 'block';
    document.getElementById('formAlterarSenha').reset();
    setTimeout(() => { msg.style.display = 'none'; }, 4000);
  } catch (erro) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className = 'erro';
    msg.style.display = 'block';
    console.error(erro);
  }
}

// ============ FUNÇÕES AUXILIARES ============
function formatarData(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
