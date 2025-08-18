/**
 * Fix específico para deployment externo - garante compatibilidade total
 */

export class ExternalDeploymentFix {
  private static instance: ExternalDeploymentFix;
  private authToken: string | null = null;
  private isExternalEnvironment: boolean = false;

  private constructor() {
    this.detectEnvironment();
  }

  public static getInstance(): ExternalDeploymentFix {
    if (!ExternalDeploymentFix.instance) {
      ExternalDeploymentFix.instance = new ExternalDeploymentFix();
    }
    return ExternalDeploymentFix.instance;
  }

  private detectEnvironment(): void {
    const hostname = window.location.hostname;
    const isReplit = hostname.includes('replit.dev') || hostname.includes('picard.replit.dev');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    this.isExternalEnvironment = !isReplit && !isLocalhost;
    
    if (this.isExternalEnvironment) {
      console.log('[ExternalFix] Ambiente externo detectado:', hostname);
      this.initializeExternalAuth();
    }
  }

  private async initializeExternalAuth(): Promise<void> {
    try {
      // Primeiro verificar se já temos um token válido
      const storedToken = localStorage.getItem('authToken');
      if (storedToken && await this.validateToken(storedToken)) {
        this.authToken = storedToken;
        console.log('[ExternalFix] Token existente válido');
        return;
      }

      // Se não temos token válido, obter um novo
      console.log('[ExternalFix] Obtendo novo token para ambiente externo');
      await this.obtainExternalToken();
      
    } catch (error) {
      console.error('[ExternalFix] Erro na inicialização:', error);
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/test-auth-jwt', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  private async obtainExternalToken(): Promise<void> {
    try {
      const response = await fetch('/api/external-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deployment: 'external',
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          this.authToken = data.token;
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('externalDeployment', 'true');
          console.log('[ExternalFix] Token externo obtido com sucesso');
        }
      } else {
        console.error('[ExternalFix] Falha ao obter token externo');
      }
    } catch (error) {
      console.error('[ExternalFix] Erro ao obter token:', error);
    }
  }

  public async getValidToken(): Promise<string | null> {
    if (!this.isExternalEnvironment) {
      return null; // Não é ambiente externo
    }

    if (!this.authToken) {
      await this.obtainExternalToken();
    }

    return this.authToken;
  }

  public isExternal(): boolean {
    return this.isExternalEnvironment;
  }

  public async ensureAuthentication(): Promise<boolean> {
    if (!this.isExternalEnvironment) {
      return true; // Não é ambiente externo, não precisa fazer nada
    }

    const token = await this.getValidToken();
    return !!token;
  }
}

// Auto-inicializar no carregamento
if (typeof window !== 'undefined') {
  ExternalDeploymentFix.getInstance();
}