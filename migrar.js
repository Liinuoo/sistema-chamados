import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrar() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migração...');

    await client.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'
    `);
    console.log('✅ Coluna role adicionada (ou já existia)');

    await client.query(`UPDATE usuarios SET role = 'admin' WHERE usuario = 'admin'`);
    console.log('✅ Role do admin definido');

    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`UPDATE usuarios SET senha = $1 WHERE usuario = 'admin'`, [hash]);
    console.log('✅ Senha do admin atualizada com hash bcrypt');

    console.log('\nMigração concluída! Agora faça login com:');
    console.log('  Usuário: admin');
    console.log('  Senha:   admin123');
  } catch (erro) {
    console.error('Erro na migração:', erro.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
