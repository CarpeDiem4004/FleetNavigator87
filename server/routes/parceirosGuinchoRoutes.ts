import express from 'express';
import { hybridAuth as isAuthenticated } from '../middleware/hybridAuth';
import { pool } from '../db';

const router = express.Router();

// Verificar/criar tabelas necessárias
async function criarTabelasParceirosGuincho() {
  try {
    // Verificar se a tabela parceiros_guincho existe
    const checkParceirosTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'parceiros_guincho'
      );
    `);
    
    if (!checkParceirosTable.rows[0].exists) {
      console.log("Criando tabela parceiros_guincho...");
      await pool.query(`
        CREATE TABLE parceiros_guincho (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          cnpj TEXT NOT NULL,
          telefone TEXT NOT NULL,
          email TEXT NOT NULL,
          endereco TEXT NOT NULL,
          cidade TEXT NOT NULL,
          estado TEXT NOT NULL,
          cep TEXT NOT NULL,
          contato_nome TEXT NOT NULL,
          contato_telefone TEXT NOT NULL,
          data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ativo BOOLEAN DEFAULT TRUE
        )
      `);
      console.log("Tabela parceiros_guincho criada com sucesso!");
    } else {
      console.log("Tabela parceiros_guincho já existe.");
    }
    
    // Verificar se a tabela servicos_guincho existe
    const checkServicosTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'servicos_guincho'
      );
    `);
    
    if (!checkServicosTable.rows[0].exists) {
      console.log("Criando tabela servicos_guincho...");
      await pool.query(`
        CREATE TABLE servicos_guincho (
          id SERIAL PRIMARY KEY,
          parceiro_id INTEGER NOT NULL REFERENCES parceiros_guincho(id),
          placa_veiculo TEXT NOT NULL,
          modelo_veiculo TEXT NOT NULL,
          endereco_origem TEXT NOT NULL,
          endereco_destino TEXT NOT NULL,
          quilometragem NUMERIC(10,2) NOT NULL,
          valor NUMERIC(10,2) NOT NULL,
          data_servico TIMESTAMP NOT NULL,
          data_lancamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'pendente',
          motivo_negacao TEXT,
          observacoes TEXT,
          CONSTRAINT check_status CHECK (status IN ('pendente', 'aprovado', 'em_analise', 'negado'))
        )
      `);
      console.log("Tabela servicos_guincho criada com sucesso!");
    } else {
      console.log("Tabela servicos_guincho já existe.");
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao criar tabelas para parceiros de guincho:", error);
    return false;
  }
}

// Rota para listar todos os parceiros de guincho
router.get('/parceiros', isAuthenticated, async (req, res) => {
  try {
    // Criar tabelas se necessário
    await criarTabelasParceirosGuincho();
    
    const result = await pool.query(`
      SELECT * FROM parceiros_guincho 
      ORDER BY nome ASC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Erro ao listar parceiros de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar parceiros de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para obter um parceiro de guincho específico
router.get('/parceiros/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    const result = await pool.query(`
      SELECT * FROM parceiros_guincho WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado"
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao obter parceiro de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter parceiro de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para criar um parceiro de guincho
router.post('/parceiros', isAuthenticated, async (req, res) => {
  try {
    await criarTabelasParceirosGuincho();
    
    const {
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cep,
      contato_nome,
      contato_telefone
    } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !cnpj || !telefone || !email || !endereco || !cidade || !estado || !cep || !contato_nome || !contato_telefone) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios"
      });
    }
    
    // Verificar se já existe um parceiro com o mesmo CNPJ
    const checkCnpj = await pool.query(`
      SELECT id FROM parceiros_guincho WHERE cnpj = $1
    `, [cnpj]);
    
    if (checkCnpj.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Já existe um parceiro com este CNPJ"
      });
    }
    
    const result = await pool.query(`
      INSERT INTO parceiros_guincho (
        nome, cnpj, telefone, email, endereco, cidade, estado, 
        cep, contato_nome, contato_telefone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      nome, cnpj, telefone, email, endereco, cidade, estado, 
      cep, contato_nome, contato_telefone
    ]);
    
    res.status(201).json({
      success: true,
      message: "Parceiro de guincho cadastrado com sucesso",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao criar parceiro de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar parceiro de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para atualizar um parceiro de guincho
router.put('/parceiros/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cep,
      contato_nome,
      contato_telefone,
      ativo
    } = req.body;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    // Validar campos obrigatórios
    if (!nome || !cnpj || !telefone || !email || !endereco || !cidade || !estado || !cep || !contato_nome || !contato_telefone) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios"
      });
    }
    
    // Verificar se o parceiro existe
    const checkExists = await pool.query(`
      SELECT id FROM parceiros_guincho WHERE id = $1
    `, [id]);
    
    if (checkExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado"
      });
    }
    
    // Verificar se já existe outro parceiro com o mesmo CNPJ
    const checkCnpj = await pool.query(`
      SELECT id FROM parceiros_guincho WHERE cnpj = $1 AND id != $2
    `, [cnpj, id]);
    
    if (checkCnpj.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Já existe outro parceiro com este CNPJ"
      });
    }
    
    const result = await pool.query(`
      UPDATE parceiros_guincho SET
        nome = $1,
        cnpj = $2,
        telefone = $3,
        email = $4,
        endereco = $5,
        cidade = $6,
        estado = $7,
        cep = $8,
        contato_nome = $9,
        contato_telefone = $10,
        ativo = $11
      WHERE id = $12
      RETURNING *
    `, [
      nome, cnpj, telefone, email, endereco, cidade, estado, 
      cep, contato_nome, contato_telefone, ativo !== undefined ? ativo : true, id
    ]);
    
    res.status(200).json({
      success: true,
      message: "Parceiro de guincho atualizado com sucesso",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao atualizar parceiro de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar parceiro de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para excluir um parceiro de guincho
router.delete('/parceiros/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    // Verificar se o parceiro existe
    const checkExists = await pool.query(`
      SELECT id FROM parceiros_guincho WHERE id = $1
    `, [id]);
    
    if (checkExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado"
      });
    }
    
    // Verificar se há serviços associados a este parceiro
    const checkServicos = await pool.query(`
      SELECT id FROM servicos_guincho WHERE parceiro_id = $1
    `, [id]);
    
    if (checkServicos.rows.length > 0) {
      // Em vez de excluir, apenas inativar
      const result = await pool.query(`
        UPDATE parceiros_guincho SET ativo = false WHERE id = $1
        RETURNING *
      `, [id]);
      
      return res.status(200).json({
        success: true,
        message: "Parceiro de guincho inativado pois possui serviços associados",
        data: result.rows[0]
      });
    }
    
    // Se não houver serviços, excluir o parceiro
    await pool.query(`
      DELETE FROM parceiros_guincho WHERE id = $1
    `, [id]);
    
    res.status(200).json({
      success: true,
      message: "Parceiro de guincho excluído com sucesso"
    });
  } catch (error) {
    console.error("Erro ao excluir parceiro de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir parceiro de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para listar serviços de guincho
router.get('/servicos', isAuthenticated, async (req, res) => {
  try {
    await criarTabelasParceirosGuincho();
    
    // Obter filtros da query string
    const { status, parceiro_id } = req.query;
    
    let query = `
      SELECT s.*, p.nome as parceiro_nome 
      FROM servicos_guincho s
      JOIN parceiros_guincho p ON s.parceiro_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Aplicar filtros se fornecidos
    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    
    if (parceiro_id) {
      params.push(parceiro_id);
      query += ` AND s.parceiro_id = $${params.length}`;
    }
    
    // Ordenar por data de lançamento (mais recentes primeiro)
    query += ` ORDER BY s.data_lancamento DESC`;
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Erro ao listar serviços de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar serviços de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para obter um serviço de guincho específico
router.get('/servicos/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    const result = await pool.query(`
      SELECT s.*, p.nome as parceiro_nome 
      FROM servicos_guincho s
      JOIN parceiros_guincho p ON s.parceiro_id = p.id
      WHERE s.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Serviço não encontrado"
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao obter serviço de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter serviço de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para criar um serviço de guincho
router.post('/servicos', isAuthenticated, async (req, res) => {
  try {
    await criarTabelasParceirosGuincho();
    
    const {
      parceiro_id,
      placa_veiculo,
      modelo_veiculo,
      endereco_origem,
      endereco_destino,
      quilometragem,
      valor,
      data_servico,
      observacoes
    } = req.body;
    
    // Validar campos obrigatórios
    if (!parceiro_id || !placa_veiculo || !modelo_veiculo || !endereco_origem || 
        !endereco_destino || !quilometragem || !valor || !data_servico) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios não informados"
      });
    }
    
    // Verificar se o parceiro existe
    const checkParceiro = await pool.query(`
      SELECT id FROM parceiros_guincho WHERE id = $1
    `, [parceiro_id]);
    
    if (checkParceiro.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parceiro não encontrado"
      });
    }
    
    const result = await pool.query(`
      INSERT INTO servicos_guincho (
        parceiro_id, placa_veiculo, modelo_veiculo, endereco_origem, 
        endereco_destino, quilometragem, valor, data_servico, observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      parceiro_id, placa_veiculo, modelo_veiculo, endereco_origem,
      endereco_destino, quilometragem, valor, data_servico, observacoes
    ]);
    
    res.status(201).json({
      success: true,
      message: "Serviço de guincho registrado com sucesso",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao registrar serviço de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar serviço de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para atualizar o status de um serviço de guincho (aprovação/rejeição)
router.put('/servicos/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo_negacao } = req.body;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    // Validar status
    if (!status || !['pendente', 'aprovado', 'em_analise', 'negado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido"
      });
    }
    
    // Se o status for 'negado', o motivo da negação é obrigatório
    if (status === 'negado' && !motivo_negacao) {
      return res.status(400).json({
        success: false,
        message: "Motivo da negação é obrigatório"
      });
    }
    
    // Verificar se o serviço existe
    const checkServico = await pool.query(`
      SELECT id, status FROM servicos_guincho WHERE id = $1
    `, [id]);
    
    if (checkServico.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Serviço não encontrado"
      });
    }
    
    // Atualizar o status do serviço
    const updateQuery = status === 'negado'
      ? `UPDATE servicos_guincho SET status = $1, motivo_negacao = $2 WHERE id = $3 RETURNING *`
      : `UPDATE servicos_guincho SET status = $1, motivo_negacao = NULL WHERE id = $2 RETURNING *`;
    
    const updateParams = status === 'negado'
      ? [status, motivo_negacao, id]
      : [status, id];
    
    const result = await pool.query(updateQuery, updateParams);
    
    res.status(200).json({
      success: true,
      message: `Status do serviço atualizado para ${status}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao atualizar status do serviço de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar status do serviço de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para excluir um serviço de guincho
router.delete('/servicos/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }
    
    // Verificar se o serviço existe
    const checkServico = await pool.query(`
      SELECT id FROM servicos_guincho WHERE id = $1
    `, [id]);
    
    if (checkServico.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Serviço não encontrado"
      });
    }
    
    // Excluir o serviço
    await pool.query(`
      DELETE FROM servicos_guincho WHERE id = $1
    `, [id]);
    
    res.status(200).json({
      success: true,
      message: "Serviço de guincho excluído com sucesso"
    });
  } catch (error) {
    console.error("Erro ao excluir serviço de guincho:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir serviço de guincho",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;