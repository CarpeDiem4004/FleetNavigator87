/**
 * Utilitários específicos para otimização de performance em dispositivos móveis
 * Focado em resolver lentidão no carregamento de projetos do posto Osasco V2
 */

interface ConnectionInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface PerformanceMetrics {
  deviceType: 'mobile' | 'desktop';
  connectionSpeed: 'slow' | 'medium' | 'fast';
  memoryLevel: 'low' | 'medium' | 'high';
  browserEngine: string;
}

/**
 * Detecta capacidades do dispositivo móvel
 */
export function getDeviceCapabilities(): PerformanceMetrics {
  const userAgent = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Detectar engine do browser
  let browserEngine = 'unknown';
  if (userAgent.includes('WebKit')) browserEngine = 'webkit';
  if (userAgent.includes('Gecko')) browserEngine = 'gecko';
  if (userAgent.includes('Trident')) browserEngine = 'trident';

  // Analisar conexão de rede
  const connection = (navigator as any).connection;
  let connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium';
  
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      connectionSpeed = 'slow';
    } else if (effectiveType === '3g') {
      connectionSpeed = 'medium';
    } else if (effectiveType === '4g') {
      connectionSpeed = 'fast';
    }
  }

  // Estimar nível de memória baseado no device
  let memoryLevel: 'low' | 'medium' | 'high' = 'medium';
  if ((navigator as any).deviceMemory) {
    const memory = (navigator as any).deviceMemory;
    if (memory <= 2) memoryLevel = 'low';
    else if (memory <= 4) memoryLevel = 'medium';
    else memoryLevel = 'high';
  }

  return {
    deviceType: isMobile ? 'mobile' : 'desktop',
    connectionSpeed,
    memoryLevel,
    browserEngine
  };
}

/**
 * Otimiza requisições para dispositivos móveis
 */
export async function optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const capabilities = getDeviceCapabilities();
  
  // Configurações específicas para mobile
  const optimizedOptions: RequestInit = {
    ...options,
    // Reduzir timeout para conexões lentas
    signal: AbortSignal.timeout(capabilities.connectionSpeed === 'slow' ? 15000 : 10000),
  };

  // Headers otimizados para mobile
  const headers = new Headers(options.headers);
  
  // Indicar preferência por compressão em conexões lentas
  if (capabilities.connectionSpeed === 'slow') {
    headers.set('Accept-Encoding', 'gzip, deflate, br');
  }

  // Solicitar prioridade alta para dados críticos
  headers.set('Priority', 'u=1, i');
  
  optimizedOptions.headers = headers;

  console.log(`[MOBILE-OPT] Fazendo requisição otimizada para ${capabilities.deviceType}`);
  console.log(`[MOBILE-OPT] Conexão: ${capabilities.connectionSpeed}, Memória: ${capabilities.memoryLevel}`);

  const startTime = performance.now();
  
  try {
    const response = await fetch(url, optimizedOptions);
    const fetchTime = performance.now() - startTime;
    
    console.log(`[MOBILE-OPT] Requisição concluída em ${fetchTime.toFixed(2)}ms`);
    
    // Alertas específicos para mobile
    if (capabilities.deviceType === 'mobile' && fetchTime > 3000) {
      console.warn(`[MOBILE-OPT] LENTO! ${fetchTime.toFixed(2)}ms em dispositivo móvel`);
    }
    
    return response;
  } catch (error) {
    const errorTime = performance.now() - startTime;
    console.error(`[MOBILE-OPT] Erro após ${errorTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Cache inteligente que considera capacidades do dispositivo
 */
export class MobileCache {
  private static readonly MOBILE_CACHE_KEY = 'mobile_optimized_cache_';
  
  static set(key: string, data: any, ttlMinutes: number = 5): void {
    const capabilities = getDeviceCapabilities();
    
    // Ajustar TTL baseado na conexão
    let adjustedTTL = ttlMinutes;
    if (capabilities.connectionSpeed === 'slow') {
      adjustedTTL = ttlMinutes * 2; // Cache mais longo para conexões lentas
    }
    
    // Reduzir dados armazenados se memória for baixa
    let processedData = data;
    if (capabilities.memoryLevel === 'low') {
      processedData = this.compressData(data);
    }
    
    const cacheData = {
      data: processedData,
      timestamp: Date.now(),
      ttl: adjustedTTL * 60 * 1000,
      capabilities
    };
    
    try {
      localStorage.setItem(this.MOBILE_CACHE_KEY + key, JSON.stringify(cacheData));
      console.log(`[MOBILE-CACHE] Dados salvos com TTL de ${adjustedTTL} minutos`);
    } catch (error) {
      console.warn('[MOBILE-CACHE] Erro ao salvar cache:', error);
      // Limpar cache antigo se estiver cheio
      this.cleanup();
    }
  }
  
  static get(key: string): any | null {
    try {
      const cached = localStorage.getItem(this.MOBILE_CACHE_KEY + key);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl;
      
      if (isExpired) {
        localStorage.removeItem(this.MOBILE_CACHE_KEY + key);
        console.log('[MOBILE-CACHE] Cache expirado removido');
        return null;
      }
      
      console.log('[MOBILE-CACHE] Cache hit!');
      return cacheData.data;
    } catch (error) {
      console.warn('[MOBILE-CACHE] Erro ao ler cache:', error);
      return null;
    }
  }
  
  private static compressData(data: any): any {
    // Remover campos desnecessários para economizar memória
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'object' && item !== null) {
          const compressed: any = {};
          // Manter apenas campos essenciais
          const essentialFields = ['id', 'name', 'base_name', 'bases'];
          for (const field of essentialFields) {
            if (item[field] !== undefined) {
              compressed[field] = item[field];
            }
          }
          return compressed;
        }
        return item;
      });
    }
    return data;
  }
  
  private static cleanup(): void {
    console.log('[MOBILE-CACHE] Limpando cache antigo...');
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.MOBILE_CACHE_KEY)) {
        keysToRemove.push(key);
      }
    }
    
    // Remover metade dos itens mais antigos
    keysToRemove.slice(0, Math.floor(keysToRemove.length / 2)).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

/**
 * Pré-carregamento inteligente para mobile
 */
export function preloadCriticalData(url: string): void {
  const capabilities = getDeviceCapabilities();
  
  // Só pré-carregar se a conexão for boa
  if (capabilities.connectionSpeed === 'fast' && capabilities.memoryLevel !== 'low') {
    console.log('[MOBILE-OPT] Pré-carregando dados críticos...');
    
    // Usar requestIdleCallback se disponível
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        optimizedFetch(url).catch(err => 
          console.log('[MOBILE-OPT] Pré-carregamento falhou:', err.message)
        );
      });
    } else {
      setTimeout(() => {
        optimizedFetch(url).catch(err => 
          console.log('[MOBILE-OPT] Pré-carregamento falhou:', err.message)
        );
      }, 100);
    }
  }
}