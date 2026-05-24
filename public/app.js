// ============ CONFIGURAÇÃO INICIAL ============
var API_URL = '/api';
var usuarioLogado = null;

document.addEventListener('DOMContentLoaded', function() {
  var tokenSalvo = localStorage.getItem('token');
  var usuarioSalvo = localStorage.getItem('usuario');

  if (tokenSalvo && usuarioSalvo) {
    usuarioLogado = JSON.parse(usuarioSalvo);
    mostrarDashboard();
    carregarDados();
  }

  document.getElementById('formLogin').addEventListener('submit', fazerLogin);
  document.getElementById('btnLogout').addEventListener('click', fazerLogout);
  document.getElementById('formNovoChamado').addEventListener('submit', criarChamado);
  document.getElementById('formCriarUsuario').addEventListener('submit', criarUsuario);
  document.getElementById('formAlterarSenha').addEventListener('submit', alterarSenha);

  window.onclick = function(e) {
    var modal = document.getElementById('modalChamado');
    if (e.target === modal) fecharModal();
  };
});

// ============ AUTENTICAÇÃO ============
function fazerLogin(e) {
  e.preventDefault();

  var usuario = document.getElementById('usuario').value.trim();
  var senha = document.getElementById('senha').value;
  var msgErro = document.getElementById('mensagemTroca');

  msgErro.style.display = 'none';

  var headers = { 'Content-Type': 'application/json' };

  fetch(API_URL + '/login', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ usuario: usuario, senha: senha })
  })
  .then(function(response) {
    return response.json().then(function(dados) {
      return { ok: response.ok, dados: dados };
    });
  })
  .then(function(result) {
    if (!result.ok) {
      msgErro.textContent = result.dados.erro || 'Usuário ou senha incorretos';
      msgErro.style.display = 'block';
      return;
    }

    var dados = result.dados;
    localStorage.setItem('token', dados.token);
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));
    usuarioLogado = dados.usuario;

    document.getElementById('formLogin').reset();
    mostrarDashboard();
    carregarDados();
  })
  .catch(function(erro) {
    msgErro.textContent = 'Erro de conexão com o servidor';
    msgErro.style.display = 'block';
    console.error('Erro ao fazer login:', erro);
  });
}

function fazerLogout() {
  usuarioLogado = null;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');

  document.getElementById('telalogin').style.display = 'flex';
  document.getElementById('teladashboard').style.display = 'none';
  document.getElementById('formLogin').reset();
  document.getElementById('mensagemTroca').style.display = 'none';
}

// ============ REQUISIÇÃO AUTENTICADA ============
function fazerRequisicao(url, opcoes) {
  opcoes = opcoes || {};

  var token = localStorage.getItem('token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  return fetch(API_URL + url, {
    method: opcoes.method || 'GET',
    headers: headers,
    body: opcoes.body || undefined
  })
  .then(function(response) {
    return response.json().then(function(dados) {
      if (!response.ok) {
        var err = new Error(dados.erro || 'Erro ' + response.status);
        err.dados = dados;
        throw err;
      }
      return dados;
    });
  });
}

// ============ NAVEGAÇÃO ============
function mostrarDashboard() {
  document.getElementById('telalogin').style.display = 'none';
  document.getElementById('teladashboard').style.display = 'flex';
  document.getElementById('nomeUsuario').textContent = usuarioLogado.nome;

  var menuAdmin = document.getElementById('menuGerenciarUsuarios');
  menuAdmin.style.display = usuarioLogado.role === 'admin' ? 'block' : 'none';
}

function mostrarSecao(secao) {
  document.querySelectorAll('.secao').forEach(function(s) {
    s.classList.remove('active');
  });
  document.querySelectorAll('.menu-item').forEach(function(m) {
    m.classList.remove('active');
  });

  document.getElementById(secao).classList.add('active');
  if (event && event.target) event.target.classList.add('active');

  if (secao === 'dashboard') {
    carregarDados();
  } else if (secao === 'meus-chamados') {
    carregarChamados();
  } else if (secao === 'relatorio') {
    var hoje = new Date();
    var trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
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

// ============ DASHBOARD ============
function carregarDados() {
  fazerRequisicao('/relatorio')
  .then(function(relatorio) {
    document.getElementById('totalChamados').textContent = relatorio.total_chamados || 0;
    document.getElementById('totalResolvidos').textContent = relatorio.total_resolvidos || 0;
    document.getElementById('totalAbertos').textContent = relatorio.total_abertos || 0;
    document.getElementById('totalAndamento').textContent = relatorio.em_andamento || 0;
  })
  .catch(function(erro) {
    console.error('Erro ao carregar dashboard:', erro);
  });

  fazerRequisicao('/relatorio/categoria')
  .then(function(categorias) {
    renderizarResumoEmpresas(categorias);
  })
  .catch(function(erro) {
    console.error('Erro ao carregar categorias:', erro);
  });
}

function renderizarResumoEmpresas(categorias) {
  var el = document.getElementById('resumoEmpresas');
  if (!categorias.length) {
    el.innerHTML = '<p style="color:#999;">Nenhum dado disponível.</p>';
    return;
  }

  var linhas = categorias.map(function(c) {
    var taxa = c.total > 0 ? ((c.resolvidos / c.total) * 100).toFixed(1) : 0;
    return '<tr>' +
      '<td style="padding:0.75rem; border:1px solid #ddd;">' + c.categoria + '</td>' +
      '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + c.total + '</td>' +
      '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + c.resolvidos + '</td>' +
      '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + taxa + '%</td>' +
      '</tr>';
  }).join('');

  el.innerHTML =
    '<table style="width:100%; border-collapse:collapse;">' +
      '<thead><tr style="background-color:var(--primary); color:white;">' +
        '<th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Categoria</th>' +
        '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Total</th>' +
        '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Resolvidos</th>' +
        '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Taxa</th>' +
      '</tr></thead>' +
      '<tbody>' + linhas + '</tbody>' +
    '</table>';
}

// ============ CHAMADOS ============
function criarChamado(e) {
  e.preventDefault();

  var msgSucesso = document.getElementById('mensagemSucesso');
  var msgErro = document.getElementById('mensagemErro');
  msgSucesso.style.display = 'none';
  msgErro.style.display = 'none';

  var dados = {
    empresa: document.getElementById('empresa').value.trim(),
    motivo: document.getElementById('motivo').value.trim(),
    categoria: document.getElementById('categoria').value,
    prioridade: document.getElementById('prioridade').value,
    responsavel: document.getElementById('responsavel').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim()
  };

  fazerRequisicao('/chamados', {
    method: 'POST',
    body: JSON.stringify(dados)
  })
  .then(function() {
    msgSucesso.textContent = 'Chamado registrado com sucesso!';
    msgSucesso.style.display = 'block';
    document.getElementById('formNovoChamado').reset();
    setTimeout(function() { msgSucesso.style.display = 'none'; }, 4000);
  })
  .catch(function(erro) {
    msgErro.textContent = erro.message || 'Erro ao registrar chamado';
    msgErro.style.display = 'block';
    console.error('Erro ao criar chamado:', erro);
  });
}

function carregarChamados() {
  var status = document.getElementById('filtroStatus') ? document.getElementById('filtroStatus').value : '';
  var prioridade = document.getElementById('filtroPrioridade') ? document.getElementById('filtroPrioridade').value : '';
  var categoria = document.getElementById('filtroCategoria') ? document.getElementById('filtroCategoria').value : '';
  var empresa = document.getElementById('filtroEmpresa') ? document.getElementById('filtroEmpresa').value : '';

  var params = [];
  if (status) params.push('status=' + encodeURIComponent(status));
  if (prioridade) params.push('prioridade=' + encodeURIComponent(prioridade));
  if (categoria) params.push('categoria=' + encodeURIComponent(categoria));
  if (empresa) params.push('empresa=' + encodeURIComponent(empresa));

  var query = params.length ? '?' + params.join('&') : '';

  fazerRequisicao('/chamados' + query)
  .then(function(chamados) {
    renderizarChamados(chamados);
  })
  .catch(function(erro) {
    console.error('Erro ao carregar chamados:', erro);
    document.getElementById('listaChamados').innerHTML =
      '<p style="color:red; text-align:center;">Erro ao carregar chamados.</p>';
  });
}

function renderizarChamados(chamados) {
  var lista = document.getElementById('listaChamados');

  if (!chamados.length) {
    lista.innerHTML = '<p style="text-align:center; color:#999;">Nenhum chamado encontrado.</p>';
    return;
  }

  lista.innerHTML = chamados.map(function(c) {
    var statusClass = c.status.toLowerCase().replace(/ /g, '');
    var resolucaoHtml = c.resolucao
      ? '<div class="chamado-motivo"><strong>Resolução:</strong><br>' + c.resolucao + '</div>'
      : '';
    var dataResolucaoHtml = c.data_resolucao
      ? '<div class="chamado-info-item"><span class="chamado-info-label">Data de Resolução</span><span>' + formatarData(c.data_resolucao) + '</span></div>'
      : '';

    return '<div class="chamado-card">' +
      '<div class="chamado-header">' +
        '<div class="chamado-numero">' + c.numero_chamado + '</div>' +
        '<div class="chamado-badges">' +
          '<span class="badge badge-status-' + statusClass + '">' + c.status + '</span>' +
          '<span class="badge badge-prioridade-' + c.prioridade.toLowerCase() + '">' + c.prioridade + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="chamado-info">' +
        '<div class="chamado-info-item"><span class="chamado-info-label">Empresa</span><span>' + (c.empresa || '-') + '</span></div>' +
        '<div class="chamado-info-item"><span class="chamado-info-label">Categoria</span><span>' + c.categoria + '</span></div>' +
        '<div class="chamado-info-item"><span class="chamado-info-label">Data de Abertura</span><span>' + formatarData(c.data_abertura) + '</span></div>' +
        '<div class="chamado-info-item"><span class="chamado-info-label">Responsável</span><span>' + (c.responsavel || '-') + '</span></div>' +
        dataResolucaoHtml +
      '</div>' +
      '<div class="chamado-motivo"><strong>Motivo:</strong><br>' + c.motivo + '</div>' +
      resolucaoHtml +
      '<div class="chamado-acoes">' +
        '<button class="btn btn-editar" onclick="abrirModal(' + c.id + ')">✏️ Editar</button>' +
        '<button class="btn btn-deletar" onclick="deletarChamado(' + c.id + ')">🗑️ Deletar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function deletarChamado(id) {
  if (!confirm('Tem certeza que deseja deletar este chamado?')) return;

  fazerRequisicao('/chamados/' + id, { method: 'DELETE' })
  .then(function() {
    carregarChamados();
  })
  .catch(function(erro) {
    alert('Erro ao deletar chamado: ' + erro.message);
    console.error(erro);
  });
}

// ============ MODAL DE EDIÇÃO ============
function abrirModal(id) {
  fazerRequisicao('/chamados/' + id)
  .then(function(c) {
    document.getElementById('modalChamado').style.display = 'flex';
    document.getElementById('modalChamado').dataset.editarId = id;
    document.getElementById('modalNumeroChamado').value = c.numero_chamado || '';
    document.getElementById('modalEmpresa').value = c.empresa || '';
    document.getElementById('modalMotivo').value = c.motivo || '';
    document.getElementById('modalStatus').value = c.status || 'Aberto';
    document.getElementById('modalResolucao').value = c.resolucao || '';
  })
  .catch(function(erro) {
    alert('Erro ao carregar chamado: ' + erro.message);
  });
}

function fecharModal() {
  document.getElementById('modalChamado').style.display = 'none';
}

function salvarEdicaoChamado() {
  var id = document.getElementById('modalChamado').dataset.editarId;
  var status = document.getElementById('modalStatus').value;
  var resolucao = document.getElementById('modalResolucao').value.trim();

  if (status === 'Resolvido' && !resolucao) {
    alert('Informe a resolução antes de marcar como Resolvido.');
    return;
  }

  var body = { status: status };
  if (resolucao) body.resolucao = resolucao;

  fazerRequisicao('/chamados/' + id, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
  .then(function() {
    fecharModal();
    carregarChamados();
  })
  .catch(function(erro) {
    alert('Erro ao atualizar chamado: ' + erro.message);
    console.error(erro);
  });
}

// ============ RELATÓRIO ============
function gerarRelatorio() {
  var dataInicio = document.getElementById('dataInicio').value;
  var dataFim = document.getElementById('dataFim').value;

  var params = [];
  if (dataInicio) params.push('dataInicio=' + dataInicio);
  if (dataFim) params.push('dataFim=' + dataFim);
  var query = params.length ? '?' + params.join('&') : '';

  fazerRequisicao('/relatorio' + query)
  .then(function(relatorio) {
    var tempoMedio = relatorio.tempo_medio_resolucao_horas
      ? '<p style="margin-top:1rem; color:#555;">Tempo médio de resolução: <strong>' + parseFloat(relatorio.tempo_medio_resolucao_horas).toFixed(1) + 'h</strong></p>'
      : '';

    document.getElementById('relatorioConteudo').innerHTML =
      '<div class="stats-grid">' +
        '<div class="stat-card"><h3>Total de Chamados</h3><div class="numero">' + (relatorio.total_chamados || 0) + '</div></div>' +
        '<div class="stat-card sucesso"><h3>Resolvidos</h3><div class="numero sucesso">' + (relatorio.total_resolvidos || 0) + '</div></div>' +
        '<div class="stat-card alerta"><h3>Abertos</h3><div class="numero alerta">' + (relatorio.total_abertos || 0) + '</div></div>' +
        '<div class="stat-card info"><h3>Em Andamento</h3><div class="numero info">' + (relatorio.em_andamento || 0) + '</div></div>' +
      '</div>' + tempoMedio;

    return fazerRequisicao('/relatorio/categoria');
  })
  .then(function(categorias) {
    if (!categorias || !categorias.length) return;

    var linhas = categorias.map(function(d) {
      var taxa = d.total > 0 ? ((d.resolvidos / d.total) * 100).toFixed(1) : 0;
      return '<tr>' +
        '<td style="padding:0.75rem; border:1px solid #ddd;">' + d.categoria + '</td>' +
        '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + d.total + '</td>' +
        '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + d.resolvidos + '</td>' +
        '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + taxa + '%</td>' +
        '</tr>';
    }).join('');

    var tabela =
      '<table style="width:100%; border-collapse:collapse; margin-top:1.5rem;">' +
        '<thead><tr style="background-color:var(--primary); color:white;">' +
          '<th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Categoria</th>' +
          '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Total</th>' +
          '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Resolvidos</th>' +
          '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Taxa de Resolução</th>' +
        '</tr></thead>' +
        '<tbody>' + linhas + '</tbody>' +
      '</table>';

    document.getElementById('relatorioConteudo').insertAdjacentHTML('beforeend', tabela);
  })
  .catch(function(erro) {
    console.error('Erro ao gerar relatório:', erro);
  });
}

// ============ GERENCIAR USUÁRIOS (admin) ============
function carregarUsuarios() {
  fazerRequisicao('/usuarios')
  .then(function(usuarios) {
    renderizarUsuarios(usuarios);
  })
  .catch(function(erro) {
    document.getElementById('listaUsuarios').innerHTML = '<p style="color:red;">Erro ao carregar usuários.</p>';
    console.error(erro);
  });
}

function renderizarUsuarios(usuarios) {
  var lista = document.getElementById('listaUsuarios');

  if (!usuarios.length) {
    lista.innerHTML = '<p style="color:#999;">Nenhum usuário encontrado.</p>';
    return;
  }

  var linhas = usuarios.map(function(u) {
    var corBadge = u.role === 'admin' ? 'var(--primary)' : 'var(--success)';
    var labelRole = u.role === 'admin' ? 'Admin' : 'Usuário';
    var acoes = u.id !== usuarioLogado.id
      ? '<button class="btn btn-deletar" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="deletarUsuario(' + u.id + ', \'' + u.usuario + '\')">Deletar</button>'
      : '<span style="color:#999; font-size:0.8rem;">Você</span>';

    return '<tr>' +
      '<td style="padding:0.75rem; border:1px solid #ddd;">' + u.nome + '</td>' +
      '<td style="padding:0.75rem; border:1px solid #ddd;">' + u.usuario + '</td>' +
      '<td style="padding:0.75rem; border:1px solid #ddd;">' + (u.email || '-') + '</td>' +
      '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;"><span style="padding:0.25rem 0.6rem; border-radius:4px; font-size:0.8rem; font-weight:bold; background:' + corBadge + '; color:white;">' + labelRole + '</span></td>' +
      '<td style="padding:0.75rem; text-align:center; border:1px solid #ddd;">' + acoes + '</td>' +
    '</tr>';
  }).join('');

  lista.innerHTML =
    '<table style="width:100%; border-collapse:collapse;">' +
      '<thead><tr style="background-color:var(--primary); color:white;">' +
        '<th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Nome</th>' +
        '<th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Usuário</th>' +
        '<th style="padding:0.75rem; text-align:left; border:1px solid #ddd;">Email</th>' +
        '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Perfil</th>' +
        '<th style="padding:0.75rem; text-align:center; border:1px solid #ddd;">Ações</th>' +
      '</tr></thead>' +
      '<tbody>' + linhas + '</tbody>' +
    '</table>';
}

function criarUsuario(e) {
  e.preventDefault();

  var msg = document.getElementById('msgCriarUsuario');
  msg.style.display = 'none';

  var nome = document.getElementById('novoNome').value.trim();
  var usuario = document.getElementById('novoUsuario').value.trim();
  var email = document.getElementById('novoEmail').value.trim();
  var role = document.getElementById('novoRole').value;
  var senha = document.getElementById('novaSenhaUsuario').value;
  var confirmar = document.getElementById('confirmarSenhaUsuario').value;

  if (senha !== confirmar) {
    msg.textContent = 'As senhas não coincidem.';
    msg.className = 'erro';
    msg.style.display = 'block';
    return;
  }

  var token = localStorage.getItem('token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  fetch(API_URL + '/usuarios', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ nome: nome, usuario: usuario, email: email, role: role, senha: senha })
  })
  .then(function(response) {
    return response.json().then(function(dados) {
      return { ok: response.ok, dados: dados };
    });
  })
  .then(function(result) {
    if (!result.ok) {
      msg.textContent = result.dados.erro || 'Erro ao criar usuário.';
      msg.className = 'erro';
      msg.style.display = 'block';
      return;
    }
    msg.textContent = 'Usuário "' + usuario + '" criado com sucesso!';
    msg.className = 'sucesso';
    msg.style.display = 'block';
    document.getElementById('formCriarUsuario').reset();
    carregarUsuarios();
    setTimeout(function() { msg.style.display = 'none'; }, 4000);
  })
  .catch(function(erro) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className = 'erro';
    msg.style.display = 'block';
    console.error(erro);
  });
}

function deletarUsuario(id, nomeUsuario) {
  if (!confirm('Deseja deletar o usuário "' + nomeUsuario + '"?')) return;

  fazerRequisicao('/usuarios/' + id, { method: 'DELETE' })
  .then(function() {
    carregarUsuarios();
  })
  .catch(function(erro) {
    alert('Erro ao deletar usuário: ' + erro.message);
    console.error(erro);
  });
}

// ============ ALTERAR SENHA ============
function alterarSenha(e) {
  e.preventDefault();

  var msg = document.getElementById('msgAlterarSenha');
  msg.style.display = 'none';

  var senhaAtual = document.getElementById('senhaAtual').value;
  var novaSenha = document.getElementById('novaSenha').value;
  var confirmar = document.getElementById('confirmarNovaSenha').value;

  if (novaSenha !== confirmar) {
    msg.textContent = 'A nova senha e a confirmação não coincidem.';
    msg.className = 'erro';
    msg.style.display = 'block';
    return;
  }

  var token = localStorage.getItem('token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  fetch(API_URL + '/usuarios/senha', {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify({ senhaAtual: senhaAtual, novaSenha: novaSenha })
  })
  .then(function(response) {
    return response.json().then(function(dados) {
      return { ok: response.ok, dados: dados };
    });
  })
  .then(function(result) {
    if (!result.ok) {
      msg.textContent = result.dados.erro || 'Erro ao alterar senha.';
      msg.className = 'erro';
      msg.style.display = 'block';
      return;
    }
    msg.textContent = 'Senha alterada com sucesso!';
    msg.className = 'sucesso';
    msg.style.display = 'block';
    document.getElementById('formAlterarSenha').reset();
    setTimeout(function() { msg.style.display = 'none'; }, 4000);
  })
  .catch(function(erro) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className = 'erro';
    msg.style.display = 'block';
    console.error(erro);
  });
}

// ============ FUNÇÕES AUXILIARES ============
function formatarData(dataString) {
  if (!dataString) return '-';
  return new Date(dataString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
