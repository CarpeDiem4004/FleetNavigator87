/**
 * Exemplo de uso da API de Checklist de Motoristas
 * Este arquivo contém exemplos de funções para consumir a API de checklists
 * Utiliza fetch API para realizar as requisições
 */

// URL base para a API
const API_BASE_URL = 'https://muricionfleet-joaopaulo60.replit.app/api/driver-checklists';

/**
 * Função para listar todos os checklists
 * @param {Object} params - Parâmetros de filtro opcionais
 * @returns {Promise<Object>} - Promise com os dados dos checklists
 */
async function listarChecklists(params = {}) {
  try {
    // Construir query string com os parâmetros
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Importante para enviar cookies de autenticação
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    throw error;
  }
}

/**
 * Função para obter detalhes de um checklist pelo ID
 * @param {number} id - ID do checklist
 * @returns {Promise<Object>} - Promise com os dados do checklist
 */
async function obterChecklist(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao obter checklist ID ${id}:`, error);
    throw error;
  }
}

/**
 * Função para obter checklists por posto
 * @param {string} nomePosto - Nome do posto
 * @param {number} limit - Limite de registros (opcional)
 * @returns {Promise<Object>} - Promise com os dados dos checklists
 */
async function listarChecklistsPorPosto(nomePosto, limit = 50) {
  try {
    const response = await fetch(`${API_BASE_URL}/posto/${nomePosto}?limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao listar checklists para o posto ${nomePosto}:`, error);
    throw error;
  }
}

/**
 * Função para criar um novo checklist
 * @param {Object} dados - Dados do checklist
 * @returns {Promise<Object>} - Promise com o checklist criado
 */
async function criarChecklist(dados) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar checklist:', error);
    throw error;
  }
}

/**
 * Função para atualizar um checklist existente
 * @param {number} id - ID do checklist
 * @param {Object} dados - Dados para atualização
 * @returns {Promise<Object>} - Promise com o checklist atualizado
 */
async function atualizarChecklist(id, dados) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao atualizar checklist ID ${id}:`, error);
    throw error;
  }
}

/**
 * Função para excluir um checklist
 * @param {number} id - ID do checklist
 * @returns {Promise<Object>} - Promise com confirmação da exclusão
 */
async function excluirChecklist(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao excluir checklist ID ${id}:`, error);
    throw error;
  }
}

/**
 * Função auxiliar para criar um objeto de checklist válido
 * @param {Object} dados - Dados do checklist
 * @returns {Object} - Objeto de checklist válido
 */
function criarObjetoChecklist({
  driver_name,
  vehicle_plate,
  km_atual,
  condicao_pneus = 'Bom',
  condicao_luzes = 'Bom',
  condicao_freios = 'Bom',
  condicao_parabrisa = 'Bom',
  nivel_oleo = 'Normal',
  nivel_agua = 'Normal',
  estrutura_cavalo = 'OK',
  estrutura_carreta = 'OK',
  avarias = [],
  observacoes = '',
  status = 'ativo',
  driver_type = 'proprio',
  source = 'api',
  viagem_id = null
}) {
  // Validar campos obrigatórios
  if (!driver_name) throw new Error('Nome do motorista é obrigatório');
  if (!vehicle_plate) throw new Error('Placa do veículo é obrigatória');
  if (!km_atual) throw new Error('Quilometragem atual é obrigatória');
  
  return {
    driver_name,
    vehicle_plate,
    km_atual,
    condicao_pneus,
    condicao_luzes,
    condicao_freios,
    condicao_parabrisa,
    nivel_oleo,
    nivel_agua,
    estrutura_cavalo,
    estrutura_carreta,
    avarias,
    observacoes,
    status,
    driver_type,
    source,
    viagem_id
  };
}

// Exemplos de uso
async function exemploDeUso() {
  try {
    // Exemplo 1: Listar todos os checklists
    const todosChecklists = await listarChecklists();
    console.log('Todos os checklists:', todosChecklists);
    
    // Exemplo 2: Listar checklists com filtros
    const checklistsFiltrados = await listarChecklists({
      status: 'pendente',
      driver_type: 'proprio',
      limit: 10
    });
    console.log('Checklists filtrados:', checklistsFiltrados);
    
    // Exemplo 3: Obter checklists de um posto específico
    const checklistsOsasco = await listarChecklistsPorPosto('osasco_v2');
    console.log('Checklists do posto Osasco:', checklistsOsasco);
    
    // Exemplo 4: Criar um novo checklist
    const novoChecklist = criarObjetoChecklist({
      driver_name: 'Paulo Silva',
      vehicle_plate: 'DEF5678',
      km_atual: 32500,
      condicao_pneus: 'Regular',
      avarias: ['Para-choque dianteiro danificado'],
      observacoes: 'Veículo necessita de revisão nos freios',
      source: 'posto_osasco_v2'
    });
    
    const checklistCriado = await criarChecklist(novoChecklist);
    console.log('Checklist criado:', checklistCriado);
    
    // Exemplo 5: Atualizar um checklist
    if (checklistCriado.success && checklistCriado.data) {
      const atualizacao = {
        status: 'resolvido',
        observacoes: 'Revisão nos freios realizada'
      };
      
      const checklistAtualizado = await atualizarChecklist(checklistCriado.data.id, atualizacao);
      console.log('Checklist atualizado:', checklistAtualizado);
    }
    
    // Exemplo 6: Excluir um checklist (descomente para testar)
    // if (checklistCriado.success && checklistCriado.data) {
    //   const resultadoExclusao = await excluirChecklist(checklistCriado.data.id);
    //   console.log('Resultado da exclusão:', resultadoExclusao);
    // }
    
  } catch (error) {
    console.error('Erro nos exemplos de uso:', error);
  }
}

// Para executar os exemplos, descomente a linha abaixo
// exemploDeUso();

// Exportar funções para uso em outros módulos
export {
  listarChecklists,
  obterChecklist,
  listarChecklistsPorPosto,
  criarChecklist,
  atualizarChecklist,
  excluirChecklist,
  criarObjetoChecklist
};