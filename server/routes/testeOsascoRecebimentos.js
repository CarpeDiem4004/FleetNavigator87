/**
 * Rota de teste para simular recebimentos do posto Osasco V2
 * Usando o formato específico de coluna deste posto
 */
const express = require('express');
const router = express.Router();

// Dados de teste para recebimentos do posto Osasco
const dadosTeste = [
  {
    id: 1,
    nome_fornecedor: "Petrobras Distribuidora",
    tipo_produto: "Diesel S-10",
    litros_recebidos: 5000,
    valor_litro: 5.39,
    valor_total: 26950.00,
    numero_nota: "NF-5289371",
    data_entrega: "2025-05-23",
    nome_operador: "João Silva",
    observacoes: "Entrega realizada dentro do prazo",
    created_at: new Date("2025-05-23T10:15:00.000Z")
  },
  {
    id: 2,
    nome_fornecedor: "Ipiranga Distribuidora",
    tipo_produto: "Diesel Comum",
    litros_recebidos: 3000,
    valor_litro: 5.20,
    valor_total: 15600.00,
    numero_nota: "NF-0983472",
    data_entrega: "2025-05-22",
    nome_operador: "Maria Santos",
    observacoes: "Atraso na entrega compensado com desconto",
    created_at: new Date("2025-05-22T14:30:00.000Z")
  },
  {
    id: 3,
    nome_fornecedor: "Shell Brasil",
    tipo_produto: "Arla 32",
    litros_recebidos: 800,
    valor_litro: 3.25,
    valor_total: 2600.00,
    numero_nota: "NF-7653421",
    data_entrega: "2025-05-21",
    nome_operador: "Carlos Oliveira",
    observacoes: "",
    created_at: new Date("2025-05-21T09:45:00.000Z")
  }
];

// Rota GET para teste
router.get('/', async (req, res) => {
  // Simular um atraso de rede
  setTimeout(() => {
    res.json({
      success: true,
      data: dadosTeste
    });
  }, 500);
});

// Rota POST para simulação de cadastro
router.post('/', async (req, res) => {
  try {
    // Simular um atraso de processamento
    setTimeout(() => {
      const novoId = dadosTeste.length > 0 ? Math.max(...dadosTeste.map(item => item.id)) + 1 : 1;
      
      const novoRecebimento = {
        id: novoId,
        nome_fornecedor: req.body.fornecedor,
        tipo_produto: req.body.tipo_combustivel,
        litros_recebidos: parseFloat(req.body.quantidade_litros),
        valor_litro: parseFloat(req.body.valor_litro),
        valor_total: parseFloat(req.body.valor_total),
        numero_nota: req.body.numero_nota,
        data_entrega: req.body.data_entrega,
        nome_operador: req.body.operador,
        observacoes: req.body.observacoes || "",
        created_at: new Date()
      };
      
      dadosTeste.unshift(novoRecebimento);
      
      res.status(201).json({
        success: true,
        message: 'Recebimento cadastrado com sucesso',
        data: novoRecebimento
      });
    }, 800);
  } catch (error) {
    console.error('Erro ao simular cadastro de recebimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar o recebimento',
      error: error.message
    });
  }
});

module.exports = router;