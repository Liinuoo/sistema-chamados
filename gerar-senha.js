import bcrypt from 'bcryptjs';

// Função para gerar hash de senha
function gerarHashSenha(senha) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(senha, salt);
  return hash;
}

// Usar assim:
// node gerar-senha.js "sua_nova_senha"

const senhaArg = process.argv[2];

if (!senhaArg) {
  console.log('❌ Uso: node gerar-senha.js "sua_senha"');
  console.log('\nExemplo:');
  console.log('node gerar-senha.js "admin123"');
  process.exit(1);
}

const hash = gerarHashSenha(senhaArg);

console.log('\n✅ Hash gerado com sucesso!\n');
console.log('Senha:', senhaArg);
console.log('Hash:', hash);
console.log('\nUse este hash no comando SQL:');
console.log(`UPDATE usuarios SET senha = '${hash}' WHERE usuario = 'admin';\n`);
