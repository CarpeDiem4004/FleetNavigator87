/**
 * Rota de teste para simulação de recebimentos do posto Osasco V2
 * Permite testar o funcionamento do sistema sem modificar dados reais
 */

import express from 'express';
import { authenticateJWT } from '../utils/auth-utils.js';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateJWT);

// Dados de exemplo para teste
const dadosExemplo = [
  {
    id: 1,
    nome_fornecedor: 'Petrobras Distribuidora',
    tipo_produto: 'Diesel S-10',
    litros_recebidos: 5000.00,
    valor_litro: 5.390,
    valor_total: 26950.00,
    numero_nota: 'NF-5289371',
    data_entrega: '2025-05-23',
    nome_operador: 'João Silva',
    observacoes: 'Entrega realizada dentro do prazo',
    created_at: new Date('2025-05-23T14:30:00Z')
  },
  {
    id: 2,
    nome_fornecedor: 'Ipiranga Distribuidora',
    tipo_produto: 'Diesel Comum',
    litros_recebidos: 3000.00,
    valor_litro: 5.200,
    valor_total: 15600.00,
    numero_nota: 'NF-0983472',
    data_entrega: '2025-05-22',
    nome_operador: 'Maria Santos',
    observacoes: 'Atraso na entrega compensado com desconto',
    created_at: new Date('2025-05-22T16:45:00Z')
  },
  {
    id: 3,
    nome_fornecedor: 'Shell Brasil',
    tipo_produto: 'Arla 32',
    litros_recebidos: 800.00,
    valor_litro: 3.250,
    valor_total: 2600.00,
    numero_nota: 'NF-7653421',
    data_entrega: '2025-05-21',
    nome_operador: 'Carlos Oliveira',
    observacoes: null,
    created_at: new Date('2025-05-21T11:20:00Z')
  }
];

// Função para converter dados do formato do banco para o formato do frontend
function mapFromDatabase(dbRecord) {
  return {
    id: dbRecord.id,
    fornecedor: dbRecord.nome_fornecedor,
    tipo_combustivel: dbRecord.tipo_produto,
    quantidade_litros: dbRecord.litros_recebidos,
    valor_litro: dbRecord.valor_litro,
    valor_total: dbRecord.valor_total,
    numero_nota: dbRecord.numero_nota,
    data_entrega: dbRecord.data_entrega,
    nome_operador: dbRecord.nome_operador,
    observacoes: dbRecord.observacoes,
    data_registro: dbRecord.created_at,
    data_formatada: new Date(dbRecord.created_at).toLocaleDateString('pt-BR')
  };
}

// Rota para obter todos os recebimentos de teste
router.get('/', (req, res) => {
  console.log('Obtendo dados de teste para recebimentos do posto Osasco V2');
  
  // Mapear dados para o formato esperado pelo frontend
  const dados = dadosExemplo.map(mapFromDatabase);
  
  return res.status(200).json({
    success: true,
    count: dados.length,
    data: dados
  });
});

// Rota para obter um recebimento específico por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // Buscar pelo ID
  const recebimento = dadosExemplo.find(item => item.id === id);
  
  if (!recebimento) {
    return res.status(404).json({
      success: false,
      message: 'Recebimento de teste não encontrado'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: mapFromDatabase(recebimento)
  });
});

// Rota para simular o registro de um novo recebimento
router.post('/', (req, res) => {
  try {
    console.log('Simulando registro de recebimento no posto Osasco V2:', req.body);
    
    // Criar novo ID (simulando a sequência do banco)
    const newId = dadosExemplo.length > 0 
      ? Math.max(...dadosExemplo.map(item => item.id)) + 1 
      : 1;
    
    // Criar objeto no formato do banco
    const novoRecebimento = {
      id: newId,
      nome_fornecedor: req.body.fornecedor,
      tipo_produto: req.body.tipo_combustivel,
      litros_recebidos: parseFloat(req.body.quantidade_litros),
      valor_litro: parseFloat(req.body.valor_litro),
      valor_total: parseFloat(req.body.valor_total),
      numero_nota: req.body.numero_nota,
      data_entrega: req.body.data_entrega,
      nome_operador: req.body.nome_operador,
      observacoes: req.body.observacoes || null,
      created_at: new Date()
    };
    
    // Adicionar à lista de exemplos (apenas em memória, sem persistência)
    dadosExemplo.push(novoRecebimento);
    
    return res.status(201).json({
      success: true,
      message: 'Simulação de recebimento registrado com sucesso',
      data: mapFromDatabase(novoRecebimento)
    });
  } catch (error) {
    console.error('Erro na simulação de registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao simular registro de recebimento',
      error: error.message
    });
  }
});

export default router;