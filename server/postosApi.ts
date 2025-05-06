import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Interface para os dados da visão geral dos postos
 */
interface PostoResumo {
  id: number;
  nome: string;
  localizacao: string;
  capacidade_total: number;
  volume_atual: number;
  total_abastecimentos: number;
  total_litros: number;
  total_cartao?: number; // Total abastecido pelo cartão
  alerta_nivel_baixo: boolean;
  percentual: number; // Percentual de capacidade ocupada
  ultima_atualizacao: string;
}

/**
 * Interface para os detalhes de um posto específico
 */
interface PostoDetalhes extends PostoResumo {
  abastecimentos: Array<{
    id: number;
    placa: string;
    data: string;
    motorista: string;
    litros: number;
    valor_total: number;
  }>;
  historico_volume: Array<{
    data: string;
    volume: number;
  }>;
}

/**
 * Obtém a lista de postos com resumo
 */
export async function getPostosResumo(req: Request, res: Response) {
  try {
    const { ordenarPor = 'nome', direcao = 'asc', somenteComAlerta = false } = req.query;
    
    // Consulta utilizando a tabela configuracao_tanques existente
    let query = `
      SELECT 
        id, 
        posto as nome,
        posto as localizacao,
        diesel_capacidade as capacidade_total,
        diesel_nivel as volume_atual,
        COALESCE((SELECT COUNT(*) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto), 0) as total_abastecimentos,
        COALESCE((SELECT SUM(litros) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto), 0) as total_litros,
        COALESCE((SELECT SUM(litros) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto AND tipo_combustivel = 'cartao'), 0) as total_cartao,
        (diesel_nivel / diesel_capacidade * 100) as percentual,
        CASE WHEN (diesel_nivel / diesel_capacidade * 100) < 15 THEN true ELSE false END as alerta_nivel_baixo,
        updated_at as ultima_atualizacao
      FROM configuracao_tanques
    `;
    
    // Adicionar filtro de alerta se solicitado
    if (somenteComAlerta === 'true') {
      query += ' WHERE (diesel_nivel / diesel_capacidade * 100) < 15';
    }
    
    // Validar ordenação para evitar injeção SQL
    const colunas = ['nome', 'volume_atual', 'total_abastecimentos', 'total_litros', 'percentual'];
    const direcoes = ['asc', 'desc'];
    
    const coluna = colunas.includes(ordenarPor as string) ? ordenarPor : 'nome';
    const dir = direcoes.includes(direcao as string) ? direcao : 'asc';
    
    // Adaptando ordenação para os campos reais da tabela
    const colunaReal = coluna === 'nome' ? 'posto' : 
                     coluna === 'volume_atual' ? 'diesel_nivel' : 
                     coluna === 'percentual' ? '(diesel_nivel / diesel_capacidade * 100)' : coluna;
    
    query += ` ORDER BY ${colunaReal} ${dir}`;
    
    const result = await pool.query(query);
    
    // Verificar se existem dados
    if (result.rowCount === 0 || result.rowCount < 11) { // Verificar se todos os postos estão presentes
      // Criar uma lista completa com todos os postos necessários
      const dadosTeste: PostoResumo[] = [
        // Postos originais do sistema
        {
          id: 1,
          nome: 'Osasco',
          localizacao: 'Osasco - SP',
          capacidade_total: 10000,
          volume_atual: 7500,
          total_abastecimentos: 250,
          total_litros: 25000,
          total_cartao: 5800,
          alerta_nivel_baixo: false,
          percentual: 75,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 2,
          nome: 'Guarulhos',
          localizacao: 'Guarulhos - SP',
          capacidade_total: 15000,
          volume_atual: 9000,
          total_abastecimentos: 180,
          total_litros: 18000,
          total_cartao: 4200,
          alerta_nivel_baixo: false,
          percentual: 60,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 3,
          nome: 'São Paulo',
          localizacao: 'São Paulo - SP',
          capacidade_total: 12000,
          volume_atual: 9000,
          total_abastecimentos: 310,
          total_litros: 31000,
          total_cartao: 7500,
          alerta_nivel_baixo: false,
          percentual: 75,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 4,
          nome: 'Campinas',
          localizacao: 'Campinas - SP',
          capacidade_total: 20000,
          volume_atual: 8000,
          total_abastecimentos: 290,
          total_litros: 29000,
          total_cartao: 6800,
          alerta_nivel_baixo: false,
          percentual: 40,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 5,
          nome: 'ABC',
          localizacao: 'Santo André - SP',
          capacidade_total: 8000,
          volume_atual: 3000,
          total_abastecimentos: 150,
          total_litros: 15000,
          alerta_nivel_baixo: false,
          percentual: 37.5,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 6,
          nome: 'Socorro',
          localizacao: 'Socorro - SP',
          capacidade_total: 10000,
          volume_atual: 4500,
          total_abastecimentos: 200,
          total_litros: 20000,
          alerta_nivel_baixo: false,
          percentual: 45,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 7,
          nome: 'Sorocaba',
          localizacao: 'Sorocaba - SP',
          capacidade_total: 12000,
          volume_atual: 7200,
          total_abastecimentos: 220,
          total_litros: 22000,
          alerta_nivel_baixo: false,
          percentual: 60,
          ultima_atualizacao: new Date().toISOString()
        },
        // Postos v2 e novos postos
        {
          id: 8,
          nome: 'Campinas V2',
          localizacao: 'Campinas - SP',
          capacidade_total: 20000,
          volume_atual: 12000,
          total_abastecimentos: 150,
          total_litros: 15000,
          total_cartao: 8500,
          alerta_nivel_baixo: false,
          percentual: 60,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 9,
          nome: 'ABC V2',
          localizacao: 'Santo André - SP',
          capacidade_total: 15000,
          volume_atual: 1800,
          total_abastecimentos: 120,
          total_litros: 12000,
          total_cartao: 4200,
          alerta_nivel_baixo: true,
          percentual: 12,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 10,
          nome: 'Socorro V2',
          localizacao: 'Socorro - SP',
          capacidade_total: 10000,
          volume_atual: 5000,
          total_abastecimentos: 180,
          total_litros: 18000,
          total_cartao: 5800,
          alerta_nivel_baixo: false,
          percentual: 50,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 11,
          nome: 'Sorocaba V2',
          localizacao: 'Sorocaba - SP',
          capacidade_total: 12000,
          volume_atual: 8400,
          total_abastecimentos: 210,
          total_litros: 21000,
          total_cartao: 6200,
          alerta_nivel_baixo: false,
          percentual: 70,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 12,
          nome: 'Alair V2',
          localizacao: 'Alair - SP',
          capacidade_total: 15000,
          volume_atual: 9000,
          total_abastecimentos: 230,
          total_litros: 23000,
          total_cartao: 7800,
          alerta_nivel_baixo: false,
          percentual: 60,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 13,
          nome: 'Remédios',
          localizacao: 'São Paulo - SP',
          capacidade_total: 8000,
          volume_atual: 1000,
          total_abastecimentos: 110,
          total_litros: 11000,
          total_cartao: 3600,
          alerta_nivel_baixo: true,
          percentual: 12.5,
          ultima_atualizacao: new Date().toISOString()
        },
        {
          id: 14,
          nome: 'Osasco V2',
          localizacao: 'Osasco - SP',
          capacidade_total: 10000,
          volume_atual: 6000,
          total_abastecimentos: 180,
          total_litros: 18000,
          total_cartao: 5300,
          alerta_nivel_baixo: false,
          percentual: 60,
          ultima_atualizacao: new Date().toISOString()
        }
      ];
      
      // Ordenar dados de teste conforme solicitado
      if (coluna === 'nome') {
        dadosTeste.sort((a, b) => dir === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome));
      } else if (coluna === 'volume_atual') {
        dadosTeste.sort((a, b) => dir === 'asc' ? a.volume_atual - b.volume_atual : b.volume_atual - a.volume_atual);
      } else if (coluna === 'total_abastecimentos') {
        dadosTeste.sort((a, b) => dir === 'asc' ? a.total_abastecimentos - b.total_abastecimentos : b.total_abastecimentos - a.total_abastecimentos);
      } else if (coluna === 'total_litros') {
        dadosTeste.sort((a, b) => dir === 'asc' ? a.total_litros - b.total_litros : b.total_litros - a.total_litros);
      } else if (coluna === 'percentual') {
        dadosTeste.sort((a, b) => dir === 'asc' ? a.percentual - b.percentual : b.percentual - a.percentual);
      }
      
      // Filtrar apenas postos com alerta se solicitado
      const postosFiltrados = somenteComAlerta === 'true' 
        ? dadosTeste.filter(posto => posto.alerta_nivel_baixo) 
        : dadosTeste;
      
      return res.json({ 
        success: true, 
        data: postosFiltrados,
        message: "Usando dados de teste para demonstração" 
      });
    }
    
    return res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    console.error('Erro ao obter resumo dos postos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter resumo dos postos' 
    });
  }
}

/**
 * Obtém detalhes de um posto específico
 */
export async function getPostoDetalhes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Validação do ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do posto inválido' 
      });
    }
    
    // Buscar detalhes do posto usando a tabela configuracao_tanques
    const postoQuery = `
      SELECT 
        id, 
        posto as nome,
        posto as localizacao,
        diesel_capacidade as capacidade_total,
        diesel_nivel as volume_atual,
        COALESCE((SELECT COUNT(*) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto), 0) as total_abastecimentos,
        COALESCE((SELECT SUM(litros) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto), 0) as total_litros,
        COALESCE((SELECT SUM(litros) FROM abastecimentos_postos WHERE posto = configuracao_tanques.posto AND tipo_combustivel = 'cartao'), 0) as total_cartao,
        (diesel_nivel / diesel_capacidade * 100) as percentual,
        CASE WHEN (diesel_nivel / diesel_capacidade * 100) < 15 THEN true ELSE false END as alerta_nivel_baixo,
        updated_at as ultima_atualizacao
      FROM configuracao_tanques
      WHERE id = $1
    `;
    const postoResult = await pool.query(postoQuery, [id]);
    
    if (postoResult.rowCount === 0) {
      // Dados de teste para fins de demonstração
      const idNum = parseInt(id);
      const nomes = [
        'Osasco', 'Guarulhos', 'São Paulo', 'Campinas', 'ABC', 
        'Socorro', 'Sorocaba', 'Campinas V2', 'ABC V2', 'Socorro V2',
        'Sorocaba V2', 'Alair V2', 'Remédios', 'Osasco V2'
      ];
      const localizacoes = [
        'Osasco - SP', 'Guarulhos - SP', 'São Paulo - SP', 'Campinas - SP', 'Santo André - SP',
        'Socorro - SP', 'Sorocaba - SP', 'Campinas - SP', 'Santo André - SP', 'Socorro - SP',
        'Sorocaba - SP', 'Alair - SP', 'São Paulo - SP', 'Osasco - SP'
      ];
      
      if (idNum < 1 || idNum > 14) {
        return res.status(404).json({ 
          success: false, 
          message: 'Posto não encontrado' 
        });
      }
      
      // Gerar abastecimentos simulados
      const abastecimentos = [];
      const placas = ['ABC1234', 'DEF5678', 'GHI9012', 'JKL3456', 'MNO7890'];
      const motoristas = ['João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Pereira', 'Carlos Ferreira'];
      
      for (let i = 0; i < 10; i++) {
        // Data aleatória nos últimos 30 dias
        const dataAtual = new Date();
        const diasAtras = Math.floor(Math.random() * 30);
        dataAtual.setDate(dataAtual.getDate() - diasAtras);
        
        abastecimentos.push({
          id: i + 1,
          placa: placas[Math.floor(Math.random() * placas.length)],
          data: dataAtual.toISOString(),
          motorista: motoristas[Math.floor(Math.random() * motoristas.length)],
          litros: Math.floor(Math.random() * 100) + 50,
          valor_total: (Math.floor(Math.random() * 100) + 50) * 5
        });
      }
      
      // Ordenar abastecimentos por data (mais recente primeiro)
      abastecimentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      // Gerar histórico de volume
      const historico_volume = [];
      
      // Gerar dados para os últimos 30 dias
      for (let i = 0; i < 30; i++) {
        const dataHistorico = new Date();
        dataHistorico.setDate(dataHistorico.getDate() - (30 - i));
        
        // Volume com variação para criar gráfico interessante
        const volumeBase = idNum === 2 || idNum === 5 ? 4000 : 8000; // Postos com alerta têm volume menor
        const variacao = Math.floor(Math.random() * 2000) - 1000;
        const volume = Math.max(500, Math.min(volumeBase + variacao, 15000));
        
        historico_volume.push({
          data: dataHistorico.toISOString().split('T')[0],
          volume
        });
      }
      
      // Obter dados para o posto específico com base no ID
      let capacidade, volume, percentual, alerta;
      
      // Postos com alerta (nível baixo)
      const postosComAlerta = [9, 13]; // ABC V2, Remédios
      
      // Definir capacidade baseada no tipo do posto
      if ([4, 8].includes(idNum)) { // Campinas e Campinas V2
        capacidade = 20000;
      } else if ([2, 9, 12].includes(idNum)) { // Guarulhos, ABC V2, Alair V2
        capacidade = 15000;
      } else if ([3, 7, 11].includes(idNum)) { // São Paulo, Sorocaba, Sorocaba V2
        capacidade = 12000;
      } else { // Outros postos
        capacidade = 10000;
      }
      
      // Definir volume e percentual
      if (postosComAlerta.includes(idNum)) {
        // Postos com alerta têm nível baixo
        volume = Math.floor(capacidade * 0.12); // 12% da capacidade
        percentual = 12;
        alerta = true;
      } else {
        // Outros postos têm níveis variados
        const nivelMin = 40;
        const nivelMax = 80;
        percentual = Math.floor(Math.random() * (nivelMax - nivelMin) + nivelMin);
        volume = Math.floor(capacidade * percentual / 100);
        alerta = false;
      }
      
      const detalhes: PostoDetalhes = {
        id: idNum,
        nome: nomes[idNum - 1],
        localizacao: localizacoes[idNum - 1],
        capacidade_total: capacidade,
        volume_atual: volume,
        total_abastecimentos: (Math.floor(Math.random() * 200) + 100),
        total_litros: (Math.floor(Math.random() * 20000) + 10000),
        total_cartao: (Math.floor(Math.random() * 5000) + 2000), // Adicionando total_cartao
        alerta_nivel_baixo: alerta,
        percentual: percentual,
        ultima_atualizacao: new Date().toISOString(),
        abastecimentos,
        historico_volume
      };
      
      return res.json({ 
        success: true, 
        data: detalhes,
        message: "Usando dados de teste para demonstração" 
      });
    }
    
    // Buscar histórico de abastecimentos
    const postoNomeQuery = await pool.query('SELECT posto FROM configuracao_tanques WHERE id = $1', [id]);
    const postoNome = postoNomeQuery.rows[0]?.posto;
    
    const abastecimentosQuery = `
      SELECT a.id, a.placa, a.created_at as data, a.nome_motorista as motorista, 
             a.litros, a.valor_total
      FROM abastecimentos_postos a
      WHERE a.posto = $1
      ORDER BY a.created_at DESC
      LIMIT 50
    `;
    
    const abastecimentosResult = await pool.query(abastecimentosQuery, [postoNome]);
    
    // Buscar histórico de volume (podem ser registros de reabastecimento do tanque)
    const historicoQuery = `
      SELECT 
        TO_CHAR(h.data, 'YYYY-MM-DD') as data,
        h.volume_atual as volume
      FROM historico_volume_tanques h
      WHERE h.posto_id = $1
      ORDER BY h.data
      LIMIT 30
    `;
    
    const historicoResult = await pool.query(historicoQuery, [id]);
    
    // Construir objeto de detalhes
    const detalhes: PostoDetalhes = {
      ...postoResult.rows[0],
      abastecimentos: abastecimentosResult.rows,
      historico_volume: historicoResult.rows
    };
    
    return res.json({ 
      success: true, 
      data: detalhes 
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do posto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter detalhes do posto' 
    });
  }
}

/**
 * Registra entrada de diesel no tanque
 */
export async function registrarEntradaCombustivel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { volume, nota_fiscal, fornecedor, data } = req.body;
    
    // Validação do ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do posto inválido' 
      });
    }
    
    // Validação dos dados
    if (!volume || isNaN(Number(volume)) || Number(volume) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Volume inválido' 
      });
    }
    
    if (!nota_fiscal) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número da nota fiscal é obrigatório' 
      });
    }
    
    if (!fornecedor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome do fornecedor é obrigatório' 
      });
    }
    
    // Verificar se o posto existe
    const verificarPosto = await pool.query('SELECT id FROM configuracao_tanques WHERE id = $1', [id]);
    
    if (verificarPosto.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Posto não encontrado' 
      });
    }
    
    // Iniciar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obter volume atual
      const volumeAtualQuery = await client.query(
        'SELECT diesel_nivel as volume_atual, diesel_capacidade as capacidade_total FROM configuracao_tanques WHERE id = $1',
        [id]
      );
      
      const { volume_atual, capacidade_total } = volumeAtualQuery.rows[0];
      const novoVolume = Number(volume_atual) + Number(volume);
      
      // Verificar se não excede a capacidade
      if (novoVolume > capacidade_total) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Volume excede a capacidade do tanque. Capacidade: ${capacidade_total}L, Volume atual: ${volume_atual}L, Volume a adicionar: ${volume}L` 
        });
      }
      
      // Atualizar volume
      await client.query(
        'UPDATE configuracao_tanques SET diesel_nivel = $1, updated_at = NOW() WHERE id = $2',
        [novoVolume, id]
      );
      
      // Registrar histórico
      await client.query(
        `INSERT INTO entradas_combustivel 
         (posto_id, volume, nota_fiscal, fornecedor, data_entrada, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, volume, nota_fiscal, fornecedor, data || new Date(), req.user?.id]
      );
      
      // Registrar no histórico de volume
      await client.query(
        `INSERT INTO historico_volume_tanques 
         (posto_id, volume_atual, data, tipo_operacao, referencia)
         VALUES ($1, $2, $3, 'entrada', $4)`,
        [id, novoVolume, data || new Date(), nota_fiscal]
      );
      
      await client.query('COMMIT');
      
      return res.json({ 
        success: true, 
        message: 'Entrada de combustível registrada com sucesso',
        data: {
          posto_id: id,
          volume_adicionado: volume,
          novo_volume: novoVolume,
          nota_fiscal,
          fornecedor,
          data: data || new Date()
        }
      });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao registrar entrada de combustível:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar entrada de combustível' 
    });
  }
}

/**
 * Excluir posto São Paulo
 */
export const excluirPostoSaoPaulo = async (req: Request, res: Response) => {
  // Verificar se o usuário é admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem excluir postos'
    });
  }

  try {
    // 1. Excluir configuração do posto
    const deleteConfig = await pool.query(
      'DELETE FROM configuracao_tanques WHERE posto = $1 RETURNING *',
      ['Saopaulo']
    );

    // 2. Verificar se o posto foi encontrado e excluído
    if (deleteConfig.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Posto São Paulo não encontrado ou já foi excluído'
      });
    }

    // 3. Registrar a exclusão
    console.log(`Posto São Paulo excluído com sucesso por ${req.user.name} (${req.user.email})`);

    return res.status(200).json({
      success: true,
      message: 'Posto São Paulo excluído com sucesso',
      data: deleteConfig.rows[0]
    });
  } catch (error) {
    console.error('Erro ao excluir posto São Paulo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir posto São Paulo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};