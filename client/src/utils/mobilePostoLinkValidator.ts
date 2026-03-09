/**
 * Validador e Otimizador de Links Externos para Postos em Dispositivos Móveis
 * Garante que todos os links funcionem corretamente em celulares e tablets
 */

interface PostoLinkValidation {
  id: string;
  nome: string;
  url: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  responseTime: number;
  mobileOptimized: boolean;
  errors: string[];
  recommendations: string[];
}

interface NetworkCondition {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export class MobilePostoLinkValidator {
  private static instance: MobilePostoLinkValidator;
  private validationCache: Map<string, PostoLinkValidation> = new Map();
  private networkCondition: NetworkCondition | null = null;

  static getInstance(): MobilePostoLinkValidator {
    if (!MobilePostoLinkValidator.instance) {
      MobilePostoLinkValidator.instance = new MobilePostoLinkValidator();
    }
    return MobilePostoLinkValidator.instance;
  }

  /**
   * Detecta condições de rede atuais
   */
  private detectNetworkCondition(): NetworkCondition {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 50,
      saveData: connection?.saveData || false
    };
  }

  /**
   * Valida um link de posto específico
   */
  async validatePostoLink(id: string, nome: string, url: string): Promise<PostoLinkValidation> {
    console.log(`[Mobile Link Validator] Validando posto: ${nome} (${url})`);
    
    const startTime = Date.now();
    const validation: PostoLinkValidation = {
      id,
      nome,
      url,
      status: 'pending',
      responseTime: 0,
      mobileOptimized: false,
      errors: [],
      recommendations: []
    };

    try {
      // Detectar condições de rede
      this.networkCondition = this.detectNetworkCondition();
      
      // Fazer requisição ao link do posto
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          'X-Mobile-Request': 'true'
        }
      });

      clearTimeout(timeoutId);
      validation.responseTime = Date.now() - startTime;

      if (response.ok) {
        validation.status = 'success';
        validation.mobileOptimized = this.checkMobileOptimization(response);
        
        // Verificar tempo de resposta
        if (validation.responseTime > 5000) {
          validation.status = 'warning';
          validation.recommendations.push('Tempo de resposta alto para dispositivos móveis');
        }

        // Verificar otimização mobile
        if (!validation.mobileOptimized) {
          validation.recommendations.push('Adicionar meta viewport para melhor experiência mobile');
        }

      } else {
        validation.status = 'error';
        validation.errors.push(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      validation.status = 'error';
      validation.responseTime = Date.now() - startTime;
      
      if (error?.name === 'AbortError') {
        validation.errors.push('Timeout: Link não responde em 10 segundos');
      } else {
        validation.errors.push(`Erro de conexão: ${error?.message || 'Erro desconhecido'}`);
      }
    }

    // Adicionar recomendações baseadas na rede
    this.addNetworkRecommendations(validation);

    // Cache do resultado
    this.validationCache.set(id, validation);
    
    console.log(`[Mobile Link Validator] Resultado para ${nome}:`, validation);
    return validation;
  }

  /**
   * Verifica se o link está otimizado para mobile
   */
  private checkMobileOptimization(response: Response): boolean {
    const contentType = response.headers.get('content-type') || '';
    const hasViewport = response.headers.get('x-mobile-optimized') === 'true';
    
    // Verifica se é HTML e se tem indicadores de otimização mobile
    return contentType.includes('text/html') && (
      hasViewport ||
      response.headers.get('viewport') !== null ||
      response.headers.get('x-ua-compatible') !== null
    );
  }

  /**
   * Adiciona recomendações baseadas nas condições de rede
   */
  private addNetworkRecommendations(validation: PostoLinkValidation): void {
    if (!this.networkCondition) return;

    const { effectiveType, downlink, rtt, saveData } = this.networkCondition;

    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      validation.recommendations.push('Rede 2G detectada: considere modo de economia de dados');
    }

    if (downlink < 1) {
      validation.recommendations.push('Conexão lenta: otimizar carregamento de imagens e scripts');
    }

    if (rtt > 300) {
      validation.recommendations.push('Alta latência: implementar cache local para melhor performance');
    }

    if (saveData) {
      validation.recommendations.push('Modo de economia de dados ativo: reduzir transferência de dados');
    }
  }

  /**
   * Valida todos os links dos postos
   */
  async validateAllPostoLinks(): Promise<PostoLinkValidation[]> {
    const postos = [
      { id: 'osasco_v2', nome: 'Osasco V2', url: '/posto/osasco_v2/public' },
      { id: 'alair_v2', nome: 'Alair V2', url: '/posto/alair_v2/public' },
      { id: 'campinas_v2', nome: 'Campinas V2', url: '/posto/campinas_v2/public' },
      { id: 'abc_v2', nome: 'ABC V2', url: '/posto/abc_v2/public' },
      { id: 'socorro_v2', nome: 'Socorro V2', url: '/posto/socorro_v2/public' },
      { id: 'sorocaba_v2', nome: 'Sorocaba V2', url: '/posto/sorocaba_v2/public' },
      { id: 'remedios', nome: 'Posto Remédios', url: '/posto-remedios-externo' }
    ];

    const baseUrl = window.location.origin;
    const validations: PostoLinkValidation[] = [];

    console.log('[Mobile Link Validator] Iniciando validação de todos os postos...');

    for (const posto of postos) {
      const fullUrl = `${baseUrl}${posto.url}`;
      const validation = await this.validatePostoLink(posto.id, posto.nome, fullUrl);
      validations.push(validation);
      
      // Pequeno delay entre requisições para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return validations;
  }

  /**
   * Obtém relatório de validação em cache
   */
  getCachedValidation(id: string): PostoLinkValidation | null {
    return this.validationCache.get(id) || null;
  }

  /**
   * Limpa cache de validação
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Gera relatório de status mobile
   */
  generateMobileReport(): {
    totalLinks: number;
    successfulLinks: number;
    failedLinks: number;
    mobileOptimized: number;
    averageResponseTime: number;
    recommendations: string[];
  } {
    const validations = Array.from(this.validationCache.values());
    
    return {
      totalLinks: validations.length,
      successfulLinks: validations.filter(v => v.status === 'success').length,
      failedLinks: validations.filter(v => v.status === 'error').length,
      mobileOptimized: validations.filter(v => v.mobileOptimized).length,
      averageResponseTime: validations.reduce((sum, v) => sum + v.responseTime, 0) / validations.length || 0,
      recommendations: Array.from(new Set(validations.flatMap(v => v.recommendations)))
    };
  }
}

export default MobilePostoLinkValidator;