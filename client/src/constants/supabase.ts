// Configurações de acesso à API do Supabase
export const SUPABASE_URL = "https://hvsmxxqkuyjhpsiojupb.supabase.co/rest/v1";
export const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA";

// Função para enviar dados para endpoints do Supabase
export async function enviarParaSupabase(endpoint: string, dados: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "Authorization": `Bearer ${API_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
      throw new Error(`Erro ao enviar dados: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
}

// Função para buscar dados dos endpoints do Supabase
export async function buscarDadosSupabase(endpoint: string, queryParams: string = "") {
  try {
    const url = `${SUPABASE_URL}/${endpoint}${queryParams ? `?${queryParams}` : ""}`;
    console.log("Buscando dados em:", url);
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Erro ao buscar dados: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Erro ao buscar dados de ${endpoint}:`, error);
    throw error;
  }
}

// Endpoints disponíveis
export const ENDPOINTS = {
  ABASTECIMENTOS: "abastecimentos_postos",
  RECEBIMENTOS: "recebimentos_tanques",
  MOVIMENTACOES: "movimentacoes_patio"
};