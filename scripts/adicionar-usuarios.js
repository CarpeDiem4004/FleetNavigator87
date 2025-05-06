/**
 * Script para adicionar bases e múltiplos usuários ao sistema
 * Use este script para recriar bases e usuários após uma restauração do banco de dados
 */

import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pg;
const { scrypt, randomBytes } = crypto;
const scryptAsync = promisify(scrypt);

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

// Função para gerar hash de senha
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function adicionarBaseEUsuarios() {
  // Lista de bases a serem adicionadas
  const bases = [
    {
      name: 'Gestão de Frotas',
      location: 'São Paulo',
      operation: 'Murici Logística',
      has_maintenance: true,
      has_tires: true,
      active: true
    },
    {
      name: 'Base São Paulo',
      location: 'São Paulo',
      operation: 'Operação Principal',
      has_maintenance: true,
      has_tires: true,
      active: true
    },
    {
      name: 'Base ABC',
      location: 'Santo André',
      operation: 'Coca-Cola ABC',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Campinas',
      location: 'Campinas',
      operation: 'Operação Campinas',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Osasco',
      location: 'Osasco',
      operation: 'Operação Osasco',
      has_maintenance: false,
      has_tires: false, 
      active: true
    },
    {
      name: 'Base Socorro',
      location: 'Socorro',
      operation: 'Operação Socorro',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Sorocaba',
      location: 'Sorocaba',
      operation: 'Operação Sorocaba',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Remedios',
      location: 'São Paulo',
      operation: 'Operação Remédios',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Guarulhos',
      location: 'Guarulhos',
      operation: 'Operação Guarulhos',
      has_maintenance: false,
      has_tires: false,
      active: true
    },
    {
      name: 'Base Alair',
      location: 'Alair',
      operation: 'Operação Alair',
      has_maintenance: false,
      has_tires: false,
      active: true
    }
  ];

  // Lista de usuários a serem adicionados
  const usuarios = [
    {
      name: 'Administrador',
      email: 'admin@muricionfleet.com',
      password: 'MuricionAdmin2025',
      role: 'admin',
      base_id: null,
      is_active: true
    },
    {
      name: 'Operador Externo',
      email: 'operador@muricionfleet.com',
      password: 'MuricionOp2025',
      role: 'operador',
      base_id: null,
      is_active: true
    },
    {
      name: 'Gestor São Paulo',
      email: 'gestor.sp@muricionfleet.com',
      password: 'Muricion2025',
      role: 'gestor',
      base_name: 'Base São Paulo',
      is_active: true
    },
    {
      name: 'Pneus SP',
      email: 'pneus.sp@muricionfleet.com',
      password: 'Muricion2025',
      role: 'pneus',
      base_name: 'Base São Paulo',
      is_active: true
    },
    {
      name: 'Posto ABC',
      email: 'posto.abc@muricionfleet.com',
      password: 'Muricion2025',
      role: 'posto',
      base_name: 'Base ABC',
      is_active: true
    }
    // Adicione outros usuários adicionais aqui se necessário
  ];

  // Conexão com o banco de dados
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectado ao banco de dados');
    
    // ======== PARTE 1: ADICIONAR BASES ========
    console.log('\n📊 Adicionando bases...');
    
    // Verificar se já existem bases no banco
    const checkBasesQuery = 'SELECT COUNT(*) FROM bases';
    const checkBasesResult = await pool.query(checkBasesQuery);
    const basesCount = parseInt(checkBasesResult.rows[0].count);
    
    console.log(`Total de bases existentes: ${basesCount}`);
    
    // Contadores para bases
    let novasBases = 0;
    let basesAtualizadas = 0;
    
    // Mapa para associar nomes de bases a IDs (usado depois para os usuários)
    const baseIdMap = {};
    
    // Para cada base na lista
    for (const base of bases) {
      // Verificar se a base já existe (pelo nome)
      const checkBaseQuery = 'SELECT id FROM bases WHERE name = $1';
      const checkBaseResult = await pool.query(checkBaseQuery, [base.name]);
      
      if (checkBaseResult.rows.length === 0) {
        // Base não existe, criar nova
        const insertBaseQuery = `
          INSERT INTO bases (
            name, 
            location, 
            operation, 
            has_maintenance, 
            has_tires, 
            active,
            type,
            basename,
            requests_enabled,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING id
        `;
        
        const baseResult = await pool.query(insertBaseQuery, [
          base.name,
          base.location,
          base.operation,
          base.has_maintenance,
          base.has_tires,
          base.active,
          base.type || 'padrao',
          base.basename || base.name.replace('Base ', ''),
          base.requests_enabled || false
        ]);
        
        const baseId = baseResult.rows[0].id;
        console.log(`✅ Base criada: ${base.name}, ID: ${baseId}`);
        baseIdMap[base.name] = baseId;
        novasBases++;
      } else {
        // Base já existe, atualizar
        const baseId = checkBaseResult.rows[0].id;
        baseIdMap[base.name] = baseId;
        console.log(`⚠️ Base já existe: ${base.name}, ID: ${baseId}`);
        
        // Atualizar dados da base
        const updateBaseQuery = `
          UPDATE bases
          SET 
            location = $1, 
            operation = $2, 
            has_maintenance = $3, 
            has_tires = $4, 
            active = $5,
            type = $6,
            basename = $7,
            requests_enabled = $8
          WHERE id = $9
        `;
        
        await pool.query(updateBaseQuery, [
          base.location,
          base.operation,
          base.has_maintenance,
          base.has_tires,
          base.active,
          base.type || 'padrao',
          base.basename || base.name.replace('Base ', ''),
          base.requests_enabled || false,
          baseId
        ]);
        
        console.log(`✅ Base atualizada: ${base.name}, ID: ${baseId}`);
        basesAtualizadas++;
      }
    }
    
    // Resumo das bases
    console.log('\n===== RESUMO DAS BASES =====');
    console.log(`Total de bases antes: ${basesCount}`);
    console.log(`Novas bases criadas: ${novasBases}`);
    console.log(`Bases atualizadas: ${basesAtualizadas}`);
    console.log(`Total de bases agora: ${basesCount + novasBases}`);
    
    // ======== PARTE 2: ADICIONAR USUÁRIOS ========
    console.log('\n👤 Adicionando usuários...');
    
    // Verificar se já existem usuários no banco
    const checkQuery = 'SELECT COUNT(*) FROM users';
    const checkResult = await pool.query(checkQuery);
    const userCount = parseInt(checkResult.rows[0].count);
    
    console.log(`Total de usuários existentes: ${userCount}`);
    
    // Criar contador para novos usuários
    let novosUsuarios = 0;
    let usuariosAtualizados = 0;
    
    // Para cada usuário na lista
    for (const usuario of usuarios) {
      // Resolver base_id se for referenciado por nome
      if (usuario.base_name && !usuario.base_id) {
        usuario.base_id = baseIdMap[usuario.base_name] || null;
      }
      
      // Verificar se o usuário já existe (pelo email)
      const checkUserQuery = 'SELECT id FROM users WHERE email = $1';
      const checkUserResult = await pool.query(checkUserQuery, [usuario.email]);
      
      if (checkUserResult.rows.length === 0) {
        // Usuário não existe, criar novo
        const senhaHash = await hashPassword(usuario.password);
        
        const insertQuery = `
          INSERT INTO users (name, email, password, role, base_id, basename, oficina_id, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id
        `;
        
        // Se temos o nome da base, vamos usá-lo para conseguir o basename
        const basenameFinal = usuario.basename || 
                            (usuario.base_name ? usuario.base_name.replace('Base ', '') : null);
        
        const result = await pool.query(insertQuery, [
          usuario.name,
          usuario.email,
          senhaHash,
          usuario.role,
          usuario.base_id,
          basenameFinal,
          usuario.oficina_id || null,
          usuario.is_active
        ]);
        
        console.log(`✅ Usuário criado: ${usuario.email}, ID: ${result.rows[0].id}`);
        novosUsuarios++;
      } else {
        // Usuário já existe, atualizar
        const userId = checkUserResult.rows[0].id;
        console.log(`⚠️ Usuário já existe: ${usuario.email}, ID: ${userId}`);
        
        // Atualizar a senha do usuário existente
        const senhaHash = await hashPassword(usuario.password);
        
        // Se temos o nome da base, vamos usá-lo para conseguir o basename
        const basenameFinal = usuario.basename || 
                            (usuario.base_name ? usuario.base_name.replace('Base ', '') : null);
        
        const updateQuery = `
          UPDATE users
          SET password = $1, name = $2, role = $3, base_id = $4, basename = $5, 
              oficina_id = $6, is_active = $7, updated_at = NOW()
          WHERE id = $8
        `;
        
        await pool.query(updateQuery, [
          senhaHash,
          usuario.name,
          usuario.role,
          usuario.base_id,
          basenameFinal,
          usuario.oficina_id || null,
          usuario.is_active,
          userId
        ]);
        
        console.log(`✅ Usuário atualizado: ${usuario.email}, ID: ${userId}`);
        usuariosAtualizados++;
      }
    }
    
    // Resumo final
    console.log('\n===== RESUMO DOS USUÁRIOS =====');
    console.log(`Total de usuários antes: ${userCount}`);
    console.log(`Novos usuários criados: ${novosUsuarios}`);
    console.log(`Usuários atualizados: ${usuariosAtualizados}`);
    console.log(`Total de usuários agora: ${userCount + novosUsuarios}`);
    
    // Resumo geral
    console.log('\n===== RESUMO GERAL =====');
    console.log(`Bases: ${basesCount} → ${basesCount + novasBases}`);
    console.log(`Usuários: ${userCount} → ${userCount + novosUsuarios}`);
    console.log('Operação concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a execução:', error);
  } finally {
    await pool.end();
    console.log('Conexão com o banco encerrada');
  }
}

// Executar a função principal
adicionarBaseEUsuarios().catch(err => {
  console.error('Erro na execução do script:', err);
  process.exit(1);
});