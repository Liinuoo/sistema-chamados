// ============ CONFIGURAÇÃO INICIAL ============
const API_URL = '/api';
let token = null;
let usuarioLogado = null;

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

  window.onclick = (e) => {
    const modal = document.getElementById('modalChamado');
    if (e.target === modal) fecharModal();
  };
});

// ============ AUTENTICAÇÃO ============
async function fazerLogin(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;
  const msgErro = document.getElementById('mensagemTroca');

  msgErro.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await response.json();

    if (!response.ok) {
      msgErro.textContent = dados.erro || 'Usuário ou senha incorretos';
      msgErro.style.display = 'block';
      return;
    }

    token = dados.token;
    usuarioLogado = dados.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado));

    document.getElementById('formLogin').reset();
    mostrarDashboard();
    carregarDados();
  } catch (erro) {
    msgErro.textContent = 'Erro de conexão com o servidor';
    msgErro.style.display = 'block';
    console.error('Erro ao fazer login:', erro);
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
  if (event && event.target) event.target.classList.add('active');

  if (secao === 'dashboard') {
    carregarDados();
  } else if (secao === 'meus-chamados') {
    carregarChamados();
  } else if (secao === 'relatorio') {
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    document.getElementById('dataFim').valueAsDate = hoje;
    document.getElementById('dataInicio').valueAsDate = trintaDiasAtras;
    gerarRelatorio();
  } else if (secao === 'gerenciar-usuarios') {
    carregarUsuarios();
  } else if (secao === 'alterar-senha') {
    document.getElementById('formAlterarSenha').reset();
    document.getElementById('msgAlterarSenha').style.display = 'none';
  }
}

// ============ REQUISIÇÃO AUTENTICADA ============
async function api(url, opcoes = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...opcoes.headers
    }
  });

  const dados = await response.json();

  if (!response.ok) {
    const err = new Error(dados.erro || `Erro HTTP ${response.status}`);
    err.dados = dados;
    throw err;
  }

  return dados;
}

// ============ DASHBOARD ============
async function carregarDados() {
  try {
    const relatorio = await api('/relatorio');
    document.getElementById('totalChamados').textContent = relatorio.total_chamados || 0;
    document.getElementById('totalResolvidos').textContent = relatorio.total_resolvidos || 0;
    document.getElementById('totalAbertos').textContent = relatorio.total_abertos || 0;
    document.getElementById('totalAndamento').textContent = relatorio.em_andamento || 0;

    const categorias = await api('/relatorio/categoria');
    renderizarResumoEmpresas(categorias);
  } catch (erro) {
    console.error('Erro ao carregar dados do dashboard:', erro);
  }
}

function renderizarResumoEmpresas(categorias) {
  const el = document.getElementById('resumoEmpresas');
  if (!categorias.length) {
    el.innerHTML = '<p style="color:#999;">Nenhum dado disponível.</p>';
    return;
  }
  el.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background-color:var(--primary); color:white;">
          <th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Categoria</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Total</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Resolvidos</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${categorias.map(c => {
          const taxa = c.total > 0 ? ((c.resolvidos / c.total) * 100).toFixed(1) : 0;
          return `
            <tr>
              <td style="padding:0.75rem; border:1px solid #ddd;">${c.categoria}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${c.total}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${c.resolvidos}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${taxa}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ============ CHAMADOS ============
async function criarChamado(e) {
  e.preventDefault();

  const msgSucesso = document.getElementById('mensagemSucesso');
  const msgErro = document.getElementById('mensagemErro');
  msgSucesso.style.display = 'none';
  msgErro.style.display = 'none';

  const dados = {
    empresa: document.getElementById('empresa').value.trim(),
    motivo: document.getElementById('motivo').value.trim(),
    categoria: document.getElementById('categoria').value,
    prioridade: document.getElementById('prioridade').value,
    responsavel: document.getElementById('responsavel').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim()
  };

  try {
    await api('/chamados', {
      method: 'POST',
      body: JSON.stringify(dados)
    });

    msgSucesso.textContent = 'Chamado registrado com sucesso!';
    msgSucesso.style.display = 'block';
    document.getElementById('formNovoChamado').reset();
    setTimeout(() => { msgSucesso.style.display = 'none'; }, 4000);
  } catch (erro) {
    msgErro.textContent = erro.message || 'Erro ao registrar chamado';
    msgErro.style.display = 'block';
    console.error('Erro ao criar chamado:', erro);
  }
}

async function carregarChamados() {
  const status = document.getElementById('filtroStatus')?.value || '';
  const prioridade = document.getElementById('filtroPrioridade')?.value || '';
  const categoria = document.getElementById('filtroCategoria')?.value || '';
  const empresa = document.getElementById('filtroEmpresa')?.value || '';

  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (prioridade) params.append('prioridade', prioridade);
  if (categoria) params.append('categoria', categoria);
  if (empresa) params.append('empresa', empresa);

  try {
    const chamados = await api(`/chamados?${params.toString()}`);
    renderizarChamados(chamados);
  } catch (erro) {
    console.error('Erro ao carregar chamados:', erro);
    document.getElementById('listaChamados').innerHTML =
      '<p style="color:red; text-align:center;">Erro ao carregar chamados.</p>';
  }
}

function renderizarChamados(chamados) {
  const lista = document.getElementById('listaChamados');

  if (!chamados.length) {
    lista.innerHTML = '<p style="text-align:center; color:#999;">Nenhum chamado encontrado.</p>';
    return;
  }

  lista.innerHTML = chamados.map(c => `
    <div class="chamado-card">
      <div class="chamado-header">
        <div class="chamado-numero">${c.numero_chamado}</div>
        <div class="chamado-badges">
          <span class="badge badge-status-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
          <span class="badge badge-prioridade-${c.prioridade.toLowerCase()}">${c.prioridade}</span>
        </div>
      </div>

      <div class="chamado-info">
        <div class="chamado-info-item">
          <span class="chamado-info-label">Empresa</span>
          <span>${c.empresa || '-'}</span>
        </div>
        <div class="chamado-info-item">
          <span class="chamado-info-label">Categoria</span>
          <span>${c.categoria}</span>
        </div>
        <div class="chamado-info-item">
          <span class="chamado-info-label">Data de Abertura</span>
          <span>${formatarData(c.data_abertura)}</span>
        </div>
        <div class="chamado-info-item">
          <span class="chamado-info-label">Responsável</span>
          <span>${c.responsavel || '-'}</span>
        </div>
        ${c.data_resolucao ? `
        <div class="chamado-info-item">
          <span class="chamado-info-label">Data de Resolução</span>
          <span>${formatarData(c.data_resolucao)}</span>
        </div>` : ''}
      </div>

      <div class="chamado-motivo">
        <strong>Motivo:</strong><br>${c.motivo}
      </div>

      ${c.resolucao ? `
      <div class="chamado-motivo">
        <strong>Resolução:</strong><br>${c.resolucao}
      </div>` : ''}

      <div class="chamado-acoes">
        <button class="btn btn-editar" onclick="abrirModal(${c.id}, '${escapar(c.numero_chamado)}', '${escapar(c.empresa)}', '${escapar(c.motivo)}', '${escapar(c.status)}', '${escapar(c.resolucao)}')">✏️ Editar</button>
        <button class="btn btn-deletar" onclick="deletarChamado(${c.id})">🗑️ Deletar</button>
      </div>
    </div>
  `).join('');
}

async function deletarChamado(id) {
  if (!confirm('Tem certeza que deseja deletar este chamado?')) return;

  try {
    await api(`/chamados/${id}`, { method: 'DELETE' });
    carregarChamados();
  } catch (erro) {
    alert('Erro ao deletar chamado: ' + erro.message);
    console.error(erro);
  }
}

// ============ MODAL DE EDIÇÃO ============
function abrirModal(id, numero, empresa, motivo, status, resolucao) {
  document.getElementById('modalChamado').style.display = 'flex';
  document.getElementById('modalChamado').dataset.editarId = id;
  document.getElementById('modalNumeroChamado').value = numero;
  document.getElementById('modalEmpresa').value = empresa;
  document.getElementById('modalMotivo').value = motivo;
  document.getElementById('modalStatus').value = status;
  document.getElementById('modalResolucao').value = resolucao || '';
}

function fecharModal() {
  document.getElementById('modalChamado').style.display = 'none';
}

async function salvarEdicaoChamado() {
  const id = document.getElementById('modalChamado').dataset.editarId;
  const status = document.getElementById('modalStatus').value;
  const resolucao = document.getElementById('modalResolucao').value.trim();

  if (status === 'Resolvido' && !resolucao) {
    alert('Informe a resolução antes de marcar como Resolvido.');
    return;
  }

  try {
    await api(`/chamados/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolucao: resolucao || undefined })
    });

    fecharModal();
    carregarChamados();
  } catch (erro) {
    alert('Erro ao atualizar chamado: ' + erro.message);
    console.error(erro);
  }
}

// ============ RELATÓRIO ============
async function gerarRelatorio() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;

  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);

  try {
    const relatorio = await api(`/relatorio?${params.toString()}`);
    const categorias = await api(`/relatorio/categoria`);

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
      ${relatorio.tempo_medio_resolucao_horas ? `
      <p style="margin-top:1rem; color:var(--light-text);">
        Tempo médio de resolução: <strong>${parseFloat(relatorio.tempo_medio_resolucao_horas).toFixed(1)}h</strong>
      </p>` : ''}
      ${renderizarTabelaCategorias(categorias)}
    `;
  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
  }
}

function renderizarTabelaCategorias(dados) {
  if (!dados.length) return '';
  return `
    <table style="width:100%; border-collapse:collapse; margin-top:1.5rem;">
      <thead>
        <tr style="background-color:var(--primary); color:white;">
          <th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Categoria</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Total</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Resolvidos</th>
          <th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Taxa de Resolução</th>
        </tr>
      </thead>
      <tbody>
        ${dados.map(d => {
          const taxa = d.total > 0 ? ((d.resolvidos / d.total) * 100).toFixed(1) : 0;
          return `
            <tr>
              <td style="padding:0.75rem; border:1px solid #ddd;">${d.categoria}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${d.total}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${d.resolvidos}</td>
              <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">${taxa}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ============ GERENCIAR USUÁRIOS (admin) ============
async function carregarUsuarios() {
  try {
    const usuarios = await api('/usuarios');
    renderizarUsuarios(usuarios);
  } catch (erro) {
    document.getElementById('listaUsuarios').innerHTML =
      '<p style="color:red;">Erro ao carregar usuários.</p>';
    console.error(erro);
  }
}

function renderizarUsuarios(usuarios) {
  const lista = document.getElementById('listaUsuarios');

  if (!usuarios.length) {
    lista.innerHTML = '<p style="color:#999;">Nenhum usuário encontrado.</p>';
    return;
  }

  lista.innerHTML = `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background-color:var(--primary); color:white;">
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
                background:${u.role === 'admin' ? 'var(--primary)' : 'var(--success)'}; color:white;">
                ${u.role === 'admin' ? 'Admin' : 'Usuário'}
              </span>
            </td>
            <td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">
              ${u.id !== usuarioLogado.id
                ? `<button class="btn btn-deletar" style="font-size:0.8rem; padding:0.3rem 0.7rem;"
                    onclick="deletarUsuario(${u.id}, '${escapar(u.usuario)}')">Deletar</button>`
                : '<span style="color:#999; font-size:0.8rem;">Você</span>'
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function criarUsuario(e) {
  e.preventDefault();

  const msg = document.getElementById('msgCriarUsuario');
  msg.style.display = 'none';

  const nome = document.getElementById('novoNome').value.trim();
  const usuario = document.getElementById('novoUsuario').value.trim();
  const email = document.getElementById('novoEmail').value.trim();
  const role = document.getElementById('novoRole').value;
  const senha = document.getElementById('novaSenhaUsuario').value;
  const confirmar = document.getElementById('confirmarSenhaUsuario').value;

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
  if (!confirm(`Deseja deletar o usuário "${nomeUsuario}"?`)) return;

  try {
    await api(`/usuarios/${id}`, { method: 'DELETE' });
    carregarUsuarios();
  } catch (erro) {
    alert('Erro ao deletar usuário: ' + erro.message);
    console.error(erro);
  }
}

// ============ ALTERAR SENHA ============
async function alterarSenha(e) {
  e.preventDefault();

  const msg = document.getElementById('msgAlterarSenha');
  msg.style.display = 'none';

  const senhaAtual = document.getElementById('senhaAtual').value;
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarNovaSenha').value;

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
  return new Date(dataString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapar(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
