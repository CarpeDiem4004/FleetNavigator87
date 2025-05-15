/**
 * Módulo que fornece um cliente Supabase simulado para evitar dependências externas
 * Este cliente é apenas uma simulação e não faz chamadas reais para o Supabase
 */

// Função resiliente que tenta executar uma operação e trata erros
const createResilientFunction = (fn) => async (...args) => {
  try {
    console.log(`[MockSupabase] Executando operação resiliente`);
    return await fn(...args);
  } catch (error) {
    console.error(`[MockSupabase] Erro na operação:`, error);
    // Retornar um resultado de erro padronizado
    return { 
      data: null, 
      error: { 
        message: error.message || 'Erro na operação do Supabase simulado',
        code: 'MOCK_ERROR'
      } 
    };
  }
};

// Funções simuladas
export const checkConnection = createResilientFunction(
  async () => {
    // Simular verificação de conexão
    console.log('[MockSupabase] Verificando conexão');
    return { data: { connected: true }, error: null };
  }
);

export const checkAllConnections = createResilientFunction(
  async () => {
    // Simular verificação de todas as conexões
    console.log('[MockSupabase] Verificando todas as conexões');
    return { 
      data: { 
        supabase: true, 
        api: true, 
        database: true 
      }, 
      error: null 
    };
  }
);

export const fetchRecords = createResilientFunction(
  async (table, limit = 10) => {
    // Simular busca de registros
    console.log(`[MockSupabase] Buscando registros da tabela ${table}`);
    return { 
      data: Array(limit).fill().map((_, i) => ({ 
        id: i + 1, 
        created_at: new Date().toISOString(),
        name: `Registro ${i + 1}`
      })), 
      error: null 
    };
  }
);

// Cliente Supabase simulado
const mockSupabaseClient = {
  // Autenticação
  auth: {
    signUp: async () => ({ data: null, user: null, error: { message: 'Método simulado: signUp' } }),
    signIn: async () => ({ data: null, user: null, error: { message: 'Método simulado: signIn' } }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    setSession: async () => ({ data: null, error: { message: 'Método simulado: setSession' } })
  },
  
  // Storage
  storage: {
    from: (bucket) => ({
      upload: async () => ({ data: { path: 'caminho/simulado' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://exemplo.com/arquivo-simulado.pdf' } }),
      list: async () => ({ data: Array(5).fill().map((_, i) => ({ 
        name: `arquivo-${i + 1}.pdf` 
      })), error: null })
    })
  },
  
  // Operações de banco de dados
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: async () => ({ data: { id: 1, name: 'Item simulado' }, error: null }),
        limit: (n) => ({
          order: (column, { ascending }) => ({
            execute: async () => ({ data: Array(n).fill().map((_, i) => ({ 
              id: i + 1, 
              name: `Item simulado ${i + 1}` 
            })), error: null })
          })
        })
      }),
      execute: async () => ({ data: Array(10).fill().map((_, i) => ({ 
        id: i + 1, 
        name: `Item ${i + 1}` 
      })), error: null })
    }),
    insert: (values) => ({
      returning: async () => ({ data: [{ ...values, id: Date.now() }], error: null })
    }),
    update: (values) => ({
      eq: (column, value) => ({
        returning: async () => ({ data: [{ ...values, id: value }], error: null })
      })
    }),
    delete: () => ({
      eq: (column, value) => ({
        execute: async () => ({ data: null, error: null })
      })
    })
  })
};

// Exportar o cliente simulado
export const supabase = mockSupabaseClient;

// Função que retorna o cliente de administração simulado
export const getSupabaseAdminClient = () => {
  console.log('[MockSupabase] Obtendo cliente admin simulado');
  return mockSupabaseClient;
};

// Exportar o cliente de administração simulado
export const supabaseAdmin = mockSupabaseClient;