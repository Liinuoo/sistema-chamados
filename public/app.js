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

  // Event listeners
  document.getElementById('formLogin').addEventListener('submit', fazerLogin);
  document.getElementById('btnLogout').addEventListener('click', fazerLogout);
  document.getElementById('formNovoChamado').addEventListener('submit', criarChamado);
  document.getElementById('formEditarChamado').addEventListener('submit', salvarEdicaoChamado);
});

// ============ AUTENTICAÇÃO ============
async function fazerLogin(e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;
  const mensagemErro = document.getElementById('mensagemErro');

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await response.json();

    if (!response.ok) {
      mensagemErro.textContent = dados.erro || 'Erro ao fazer login';
      mensagemErro.style.display = 'block';
      return;
    }

    // Salvar token e usuário
    token = dados.token;
    usuarioLogado = dados.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioLogado));

    mostrarDashboard();
    carregarDados();
  } catch (erro) {
    console.error('Erro ao fazer login:', erro);
    mensagemErro.textContent = 'Erro de conexão';
    mensagemErro.style.display = 'block';
  }
}

function fazerLogout() {
  token = null;
  usuarioLogado = null;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  
  document.getElementById('telaLogin').style.display = 'flex';
  document.getElementById('telaDashboard').style.display = 'none';
  document.getElementById('formLogin').reset();
  document.getElementById('mensagemErro').style.display = 'none';
}

// ============ NAVEGAÇÃO ============
function mostrarDashboard() {
  document.getElementById('telaLogin').style.display = 'none';
  document.getElementById('telaDashboard').style.display = 'flex';
  document.getElementById('nomeUsuario').textContent = usuarioLogado.nome;
}

function mostrarSecao(secao) {
  // Esconder todas as seções
  document.querySelectorAll('.secao').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

  // Mostrar seção selecionada
  document.getElementById(secao).classList.add('active');
  event.target.classList.add('active');

  // Carregar dados específicos
  if (secao === 'chamados') {
    carregarChamados();
  } else if (secao === 'dashboard') {
    carregarDados();
  } else if (secao === 'relatorio') {
    // Preencheer datas padrão (últimos 30 dias)
    const dataFim = new Date();
    const dataInicio = new Date(dataFim.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('dataFim').valueAsDate = dataFim;
    document.getElementById('dataInicio').valueAsDate = dataInicio;
  }
}

// ============ CHAMADAS À API ============
async function fazerRequisicao(url, opcoes = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...opcoes.headers
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...opcoes,
    headers
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }

  return response.json();
}

// ============ CHAMADOS ============
async function criarChamado(e) {
  e.preventDefault();

  const motivo = document.getElementById('motivo').value;
  const categoria = document.getElementById('categoria').value;
  const prioridade = document.getElementById('prioridade').value;
  const responsavel = document.getElementById('responsavel').value;
  const observacoes = document.getElementById('observacoes').value;

  try {
    await fazerRequisicao('/chamados', {
      method: 'POST',
      body: JSON.stringify({
        motivo,
        categoria,
        prioridade,
        responsavel,
        observacoes
      })
    });

    // Mostrar mensagem de sucesso
    const mensagem = document.getElementById('mensagemSucesso');
    mensagem.textContent = '✅ Chamado registrado com sucesso!';
    mensagem.style.display = 'block';

    // Limpar formulário
    document.getElementById('formNovoChamado').reset();

    // Esconder mensagem após 3 segundos
    setTimeout(() => {
      mensagem.style.display = 'none';
    }, 3000);

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

    let url = '/chamados?';
    if (status) url += `status=${status}&`;
    if (prioridade) url += `prioridade=${prioridade}&`;
    if (categoria) url += `categoria=${categoria}`;

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
        <button class="btn btn-editar" onclick="abrirModal(${chamado.id}, '${chamado.status.replace(/'/g, "\\'")}', '${(chamado.resolucao || '').replace(/'/g, "\\'")}', '${(chamado.responsavel || '').replace(/'/g, "\\'")}', '${(chamado.observacoes || '').replace(/'/g, "\\'")}')" >✏️ Editar</button>
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
  document.getElementById('editarId').value = id;
  document.getElementById('editarStatus').value = status;
  document.getElementById('editarResolucao').value = resolucao;
  document.getElementById('editarResponsavel').value = responsavel;
  document.getElementById('editarObservacoes').value = observacoes;
  document.getElementById('modalEditar').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalEditar').style.display = 'none';
}

async function salvarEdicaoChamado(e) {
  e.preventDefault();

  const id = document.getElementById('editarId').value;
  const status = document.getElementById('editarStatus').value;
  const resolucao = document.getElementById('editarResolucao').value;
  const responsavel = document.getElementById('editarResponsavel').value;
  const observacoes = document.getElementById('editarObservacoes').value;

  try {
    await fazerRequisicao(`/chamados/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        resolucao: resolucao || undefined,
        responsavel,
        observacoes
      })
    });

    fecharModal();
    carregarChamados();
    alert('Chamado atualizado com sucesso!');
  } catch (erro) {
    console.error('Erro ao atualizar chamado:', erro);
    alert('Erro ao atualizar chamado');
  }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
  const modal = document.getElementById('modalEditar');
  if (event.target === modal) {
    fecharModal();
  }
}

// ============ RELATÓRIOS E ESTATÍSTICAS ============
async function carregarDados() {
  try {
    // Carregar relatório geral
    const relatorio = await fazerRequisicao('/relatorio');
    
    document.getElementById('totalChamados').textContent = relatorio.total_chamados || 0;
    document.getElementById('totalResolvidos').textContent = relatorio.total_resolvidos || 0;
    document.getElementById('totalAbertos').textContent = relatorio.total_abertos || 0;
    document.getElementById('emAndamento').textContent = relatorio.em_andamento || 0;
    
    const tempoMedio = relatorio.tempo_medio_resolucao_horas 
      ? Math.round(relatorio.tempo_medio_resolucao_horas) 
      : 0;
    document.getElementById('tempoMedio').textContent = `${tempoMedio} horas`;

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

    document.getElementById('relTotalChamados').textContent = relatorio.total_chamados || 0;
    document.getElementById('relTotalResolvidos').textContent = relatorio.total_resolvidos || 0;
    document.getElementById('relTotalAbertos').textContent = relatorio.total_abertos || 0;
    document.getElementById('relEmAndamento').textContent = relatorio.em_andamento || 0;

    const tempoMedio = relatorio.tempo_medio_resolucao_horas 
      ? Math.round(relatorio.tempo_medio_resolucao_horas) 
      : 0;
    document.getElementById('relTempoMedio').textContent = `${tempoMedio} horas`;

    // Carregar estatísticas por categoria
    const estatisticas = await fazerRequisicao('/relatorio/categoria');
    renderizarEstatisticas(estatisticas);

  } catch (erro) {
    console.error('Erro ao gerar relatório:', erro);
    alert('Erro ao gerar relatório');
  }
}

function renderizarEstatisticas(dados) {
  const tabela = document.getElementById('tabelaCategoria');
  
  if (dados.length === 0) {
    tabela.innerHTML = '<p>Nenhum dado disponível</p>';
    return;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse;">
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
            <tr style="border: 1px solid #ddd;">
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
  
  tabela.innerHTML = html;
}

function exportarPDF() {
  alert('Função de exportação para PDF pode ser implementada com uma biblioteca como jsPDF ou html2pdf');
  // Aqui você pode integrar uma biblioteca de PDF no futuro
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
