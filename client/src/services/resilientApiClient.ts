/**
 * Cliente para a API resiliente universal
 * Permite acessar o sistema de persistência garantida para todos os módulos
 */

import axios from 'axios';

/**
 * Cliente para API universal resiliente
 * Garante que os dados sejam salvos mesmo com problemas de conexão
 */
class ResilientApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  /**
   * Construtor
   * @param baseUrl URL base da API (padrão: simplificada)
   */
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    // Obter token de autenticação do localStorage
    this.authToken = localStorage.getItem('authToken');
  }

  /**
   * Configura o token de autenticação
   * @param token Token JWT de autenticação
   */
  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  /**
   * Limpa o token de autenticação
   */
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  /**
   * Obtém headers da requisição com token de autenticação
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
    };
  }

  /**
   * Função para realizar requisições HTTP
   * @param method Método HTTP
   * @param endpoint Endpoint da API
   * @param data Dados a serem enviados
   * @returns Resposta da requisição
   */
  private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    // Lista de prefixos de URL a tentar, em ordem de prioridade
    const urlPrefixes = [
      // 1. Rota simplificada (sem prefixo)
      '',
      // 2. Rota padrão com prefixo /api
      '/api',
      // 3. Rota híbrida com prefixo
      '/api/hybrid'
    ];
    
    let lastError: any = null;
    
    // Tentar cada prefixo em ordem até um sucesso
    for (const prefix of urlPrefixes) {
      try {
        // Construir URL com o prefixo atual
        const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseUrl}${prefix}${finalEndpoint}`;
        const headers = this.getHeaders();
        
        console.log(`[ResilientApiClient] Tentando requisição ${method} para ${url}`);
        
        const response = await axios({
          method,
          url,
          headers,
          data,
        });
        
        console.log(`[ResilientApiClient] Sucesso com ${url}`);
        return response.data;
      } catch (error: any) {
        console.warn(`[ResilientApiClient] Falha na requisição ${method} para ${prefix}${endpoint}:`, 
                    error.response?.status || error.message);
        lastError = error;
        // Continuar para o próximo prefixo
      }
    }
    
    // Se chegou aqui, todos os prefixos falharam
    console.error(`[ResilientApiClient] Todas as tentativas falharam para ${endpoint}`, lastError);
    throw lastError;
  }

  /**
   * Verifica o status do sistema de persistência
   * @returns Status atual do sistema
   */
  async checkStatus(): Promise<any> {
    return this.request<any>('GET', '/status');
  }

  /**
   * Força o processamento de operações pendentes
   * @returns Resultado do processamento
   */
  async processOperations(): Promise<any> {
    return this.request<any>('POST', '/process');
  }

  // --- MÉTODOS PARA MULTAS ---

  /**
   * Busca multas com filtros opcionais
   * @param filters Filtros para a busca
   * @returns Lista de multas
   */
  async getMultas(filters?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>('GET', `/multas${query}`);
    
    return response.data || [];
  }

  /**
   * Busca uma multa pelo ID
   * @param id ID da multa
   * @returns Dados da multa
   */
  async getMultaById(id: number): Promise<any> {
    const response = await this.request<any>('GET', `/multas/${id}`);
    return response.data;
  }

  /**
   * Registra uma nova multa
   * @param dados Dados da multa
   * @returns Multa registrada
   */
  async registrarMulta(dados: any): Promise<any> {
    const response = await this.request<any>('POST', '/multas', dados);
    return response.data;
  }

  /**
   * Atualiza uma multa existente
   * @param id ID da multa
   * @param dados Dados a serem atualizados
   * @returns Multa atualizada
   */
  async atualizarMulta(id: number, dados: any): Promise<any> {
    const response = await this.request<any>('PUT', `/multas/${id}`, dados);
    return response.data;
  }

  /**
   * Atualiza o status do ciclo de vida de uma multa
   * @param id ID da multa
   * @param status Novo status
   * @param observacao Observação opcional
   * @returns Multa atualizada
   */
  async atualizarStatusMulta(id: number, status: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/multas/${id}/status`, { status, observacao });
    return response.data;
  }

  /**
   * Adiciona um documento à multa
   * @param id ID da multa
   * @param tipo Tipo do documento
   * @param url URL do documento
   * @param observacao Observação opcional
   * @returns Documento adicionado
   */
  async adicionarDocumentoMulta(id: number, tipo: string, url: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('POST', `/multas/${id}/documentos`, { tipo, url, observacao });
    return response.data;
  }

  /**
   * Registra assinatura do motorista
   * @param id ID da multa
   * @param assinaturaUrl URL da imagem da assinatura
   * @param motoristaNome Nome do motorista
   * @returns Assinatura registrada
   */
  async registrarAssinaturaMulta(id: number, assinaturaUrl: string, motoristaNome: string): Promise<any> {
    const response = await this.request<any>('POST', `/multas/${id}/assinatura`, { assinaturaUrl, motoristaNome });
    return response.data;
  }

  // --- MÉTODOS PARA MANUTENÇÕES ---

  /**
   * Busca manutenções com filtros opcionais
   * @param filters Filtros para a busca
   * @returns Lista de manutenções
   */
  async getManutencoes(filters?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>('GET', `/manutencoes${query}`);
    
    return response.data || [];
  }

  /**
   * Busca uma manutenção pelo ID
   * @param id ID da manutenção
   * @returns Dados da manutenção
   */
  async getManutencaoById(id: number): Promise<any> {
    const response = await this.request<any>('GET', `/manutencoes/${id}`);
    return response.data;
  }

  /**
   * Registra uma nova manutenção
   * @param dados Dados da manutenção
   * @returns Manutenção registrada
   */
  async registrarManutencao(dados: any): Promise<any> {
    const response = await this.request<any>('POST', '/manutencoes', dados);
    return response.data;
  }

  /**
   * Atualiza uma manutenção existente
   * @param id ID da manutenção
   * @param dados Dados a serem atualizados
   * @returns Manutenção atualizada
   */
  async atualizarManutencao(id: number, dados: any): Promise<any> {
    const response = await this.request<any>('PUT', `/manutencoes/${id}`, dados);
    return response.data;
  }

  /**
   * Atualiza o status de uma manutenção
   * @param id ID da manutenção
   * @param status Novo status
   * @param observacao Observação opcional
   * @returns Manutenção atualizada
   */
  async atualizarStatusManutencao(id: number, status: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/manutencoes/${id}/status`, { status, observacao });
    return response.data;
  }

  /**
   * Adiciona um item à manutenção
   * @param id ID da manutenção
   * @param nome Nome do item
   * @param quantidade Quantidade
   * @param valorUnitario Valor unitário
   * @param observacao Observação opcional
   * @returns Item adicionado
   */
  async adicionarItemManutencao(id: number, nome: string, quantidade: number, valorUnitario: number, observacao?: string): Promise<any> {
    const response = await this.request<any>('POST', `/manutencoes/${id}/itens`, { 
      nome, quantidade, valorUnitario, observacao 
    });
    return response.data;
  }

  /**
   * Adiciona um anexo à manutenção
   * @param id ID da manutenção
   * @param tipo Tipo do anexo
   * @param url URL do anexo
   * @param descricao Descrição opcional
   * @returns Anexo adicionado
   */
  async adicionarAnexoManutencao(id: number, tipo: string, url: string, descricao?: string): Promise<any> {
    const response = await this.request<any>('POST', `/manutencoes/${id}/anexos`, { 
      tipo, url, descricao 
    });
    return response.data;
  }

  /**
   * Busca solicitações de manutenção
   * @param filters Filtros para a busca
   * @returns Lista de solicitações
   */
  async getSolicitacoesManutencao(filters?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>('GET', `/manutencoes/solicitacoes${query}`);
    
    return response.data || [];
  }

  /**
   * Registra uma solicitação de manutenção
   * @param dados Dados da solicitação
   * @returns Solicitação registrada
   */
  async registrarSolicitacaoManutencao(dados: any): Promise<any> {
    const response = await this.request<any>('POST', '/manutencoes/solicitacoes', dados);
    return response.data;
  }

  // --- MÉTODOS PARA PNEUS ---

  /**
   * Busca pneus com filtros opcionais
   * @param filters Filtros para a busca
   * @returns Lista de pneus
   */
  async getPneus(filters?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>('GET', `/pneus${query}`);
    
    return response.data || [];
  }

  /**
   * Busca um pneu pelo ID
   * @param id ID do pneu
   * @returns Dados do pneu
   */
  async getPneuById(id: number): Promise<any> {
    const response = await this.request<any>('GET', `/pneus/${id}`);
    return response.data;
  }

  /**
   * Registra um novo pneu
   * @param dados Dados do pneu
   * @returns Pneu registrado
   */
  async registrarPneu(dados: any): Promise<any> {
    const response = await this.request<any>('POST', '/pneus', dados);
    return response.data;
  }

  /**
   * Atualiza um pneu existente
   * @param id ID do pneu
   * @param dados Dados a serem atualizados
   * @returns Pneu atualizado
   */
  async atualizarPneu(id: number, dados: any): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/${id}`, dados);
    return response.data;
  }

  /**
   * Atualiza o status de um pneu
   * @param id ID do pneu
   * @param status Novo status
   * @param observacao Observação opcional
   * @returns Pneu atualizado
   */
  async atualizarStatusPneu(id: number, status: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/${id}/status`, { status, observacao });
    return response.data;
  }

  /**
   * Associa um pneu a um veículo
   * @param id ID do pneu
   * @param veiculoPlaca Placa do veículo
   * @param posicao Posição no veículo
   * @param observacao Observação opcional
   * @returns Pneu atualizado
   */
  async associarPneuVeiculo(id: number, veiculoPlaca: string, posicao: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/${id}/associar-veiculo`, { 
      veiculoPlaca, posicao, observacao 
    });
    return response.data;
  }

  /**
   * Desassocia um pneu de um veículo
   * @param id ID do pneu
   * @param motivo Motivo da desassociação
   * @param observacao Observação opcional
   * @returns Pneu atualizado
   */
  async desassociarPneuVeiculo(id: number, motivo: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/${id}/desassociar-veiculo`, { 
      motivo, observacao 
    });
    return response.data;
  }

  /**
   * Transfere um pneu para outra base
   * @param id ID do pneu
   * @param baseIdDestino ID da base de destino
   * @param baseNomeDestino Nome da base de destino
   * @param observacao Observação opcional
   * @returns Pneu atualizado
   */
  async transferirPneuBase(id: number, baseIdDestino: number, baseNomeDestino: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/${id}/transferir-base`, { 
      baseIdDestino, baseNomeDestino, observacao 
    });
    return response.data;
  }

  /**
   * Registra medição de pneu
   * @param id ID do pneu
   * @param profundidadeSulco Profundidade do sulco em mm
   * @param pressao Pressão em psi
   * @param observacao Observação opcional
   * @returns Medição registrada
   */
  async registrarMedicaoPneu(id: number, profundidadeSulco: number, pressao: number, observacao?: string): Promise<any> {
    const response = await this.request<any>('POST', `/pneus/${id}/medicoes`, { 
      profundidadeSulco, pressao, observacao 
    });
    return response.data;
  }

  /**
   * Busca solicitações de pneus
   * @param filters Filtros para a busca
   * @returns Lista de solicitações
   */
  async getSolicitacoesPneus(filters?: Record<string, any>): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<any>('GET', `/pneus/solicitacoes${query}`);
    
    return response.data || [];
  }

  /**
   * Registra uma solicitação de pneus
   * @param dados Dados da solicitação
   * @returns Solicitação registrada
   */
  async registrarSolicitacaoPneus(dados: any): Promise<any> {
    const response = await this.request<any>('POST', '/pneus/solicitacoes', dados);
    return response.data;
  }

  /**
   * Obtém itens de uma solicitação de pneus
   * @param id ID da solicitação
   * @returns Lista de itens
   */
  async getItensSolicitacaoPneus(id: number): Promise<any[]> {
    const response = await this.request<any>('GET', `/pneus/solicitacoes/${id}/itens`);
    return response.data || [];
  }

  /**
   * Atualiza o status de uma solicitação de pneus
   * @param id ID da solicitação
   * @param status Novo status
   * @param observacao Observação opcional
   * @returns Solicitação atualizada
   */
  async atualizarStatusSolicitacaoPneus(id: number, status: string, observacao?: string): Promise<any> {
    const response = await this.request<any>('PUT', `/pneus/solicitacoes/${id}/status`, { 
      status, observacao 
    });
    return response.data;
  }
}

// Exportar cliente como singleton para usar em toda a aplicação
export const resilientApiClient = new ResilientApiClient();

// Exportação padrão para compatibilidade
export default resilientApiClient;