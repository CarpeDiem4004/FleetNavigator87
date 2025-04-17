// Configurações de acesso à API do Supabase
export const SUPABASE_URL = "https://hvsmxxqkuyjhpsiojupb.supabase.co/rest/v1";
export const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA";

// Função para enviar dados para endpoints do Supabase
export async function enviarParaSupabase(endpoint: string, dados: any, method: string = "POST") {
  try {
    // Verifica a conexão com a internet antes de tentar a requisição
    if (!navigator.onLine) {
      throw new Error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
    }
    
    const options: RequestInit = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "Authorization": `Bearer ${API_KEY}`,
        "Prefer": "return=representation"
      },
      // Adiciona timeout para a requisição
      signal: AbortSignal.timeout(10000) // 10 segundos de timeout
    };
    
    // Só adiciona o body para métodos que o requerem
    if (method !== "GET" && method !== "HEAD") {
      options.body = JSON.stringify(dados);
    }
    
    console.log(`Enviando para: ${SUPABASE_URL}/${endpoint}`, {
      method,
      body: options.body ? JSON.parse(options.body as string) : null
    });
    
    try {
      const res = await fetch(`${SUPABASE_URL}/${endpoint}`, options);
      
      if (!res.ok) {
        // Tentar obter mais detalhes sobre o erro
        let errorDetail = "";
        try {
          const errorResponse = await res.json();
          errorDetail = JSON.stringify(errorResponse);
        } catch (parseError) {
          errorDetail = await res.text();
        }
        
        throw new Error(`Erro ao enviar dados: ${res.status} - ${errorDetail}`);
      }
      
      // Algumas requisições (como DELETE) podem não retornar conteúdo
      if (res.status === 204) {
        return true;
      }
      
      return await res.json();
    } catch (fetchError: any) {
      // Tratamento para erros específicos de timeout
      if (fetchError.name === 'TimeoutError' || fetchError.message?.includes('timeout')) {
        throw new Error("Tempo limite excedido ao conectar com o servidor. Verifique sua conexão e tente novamente.");
      }
      
      // Verifica se o erro é por falta de conexão
      if (fetchError.message?.includes('Failed to fetch')) {
        throw new Error("Falha na conexão com o servidor. Verifique se você tem acesso à internet.");
      }
      
      // Repassar o erro original se não for um dos casos específicos
      throw fetchError;
    }
  } catch (error) {
    console.error(`Erro na requisição (${method}):`, error);
    throw error;
  }
}

// Função para buscar dados dos endpoints do Supabase
export async function buscarDadosSupabase(endpoint: string, queryParams: string = "") {
  try {
    // Verifica a conexão com a internet antes de tentar a requisição
    if (!navigator.onLine) {
      throw new Error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
    }
    
    const url = `${SUPABASE_URL}/${endpoint}${queryParams ? `?${queryParams}` : ""}`;
    console.log("Buscando dados em:", url);
    
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": API_KEY,
          "Authorization": `Bearer ${API_KEY}`
        },
        // Adiciona timeout para a requisição
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      });
      
      if (!res.ok) {
        // Tentar obter mais detalhes sobre o erro
        let errorDetail = "";
        try {
          const errorResponse = await res.json();
          errorDetail = JSON.stringify(errorResponse);
        } catch (parseError) {
          errorDetail = await res.text();
        }
        
        throw new Error(`Erro ao buscar dados: ${res.status} - ${errorDetail}`);
      }
      
      return await res.json();
    } catch (fetchError: any) {
      // Tratamento para erros específicos de timeout
      if (fetchError.name === 'TimeoutError' || fetchError.message?.includes('timeout')) {
        throw new Error("Tempo limite excedido ao conectar com o servidor. Verifique sua conexão e tente novamente.");
      }
      
      // Verifica se o erro é por falta de conexão
      if (fetchError.message?.includes('Failed to fetch')) {
        throw new Error("Falha na conexão com o servidor. Verifique se você tem acesso à internet.");
      }
      
      // Repassar o erro original se não for um dos casos específicos
      throw fetchError;
    }
  } catch (error) {
    console.error(`Erro ao buscar dados de ${endpoint}:`, error);
    throw error;
  }
}

// Endpoints disponíveis
export const ENDPOINTS = {
  ABASTECIMENTOS: "abastecimentos_postos",
  RECEBIMENTOS: "recebimentos_tanques",
  MOVIMENTACOES: "movimentacoes_patio",
  CONFIG_TANQUES: "controle_tanques" // Alterando para um nome que pode ser diferente na API
};

// Função para verificar a conectividade com o Supabase
export async function verificarConexaoSupabase(): Promise<boolean> {
  try {
    // Verifica se há conexão com a internet
    if (!navigator.onLine) {
      return false;
    }
    
    // Tenta fazer uma requisição simples para verificar a conectividade
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch(`${SUPABASE_URL}/health`, {
      method: 'HEAD',
      headers: {
        "apikey": API_KEY,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erro ao verificar conexão com Supabase:", error);
    return false;
  }
};