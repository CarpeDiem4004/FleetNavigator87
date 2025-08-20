/**
 * ARQUIVO DE COMPATIBILIDADE UNIFICADO PARA SUPABASE
 * 
 * Este arquivo fornece todas as funções e tipos necessários para funcionar com o Supabase
 * de forma unificada, evitando problemas de importação entre módulos.
 * 
 * Como usar: import { supabase, fetchRecords, etc... } from '@/lib/supabase-compat'
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Constantes de configuração do Supabase
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
export const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5ODIwNiwiZXhwIjoyMDYwMjc0MjA2fQ.bvwwqQBQVUOlyHYMsX9C5dSQhsQYI2r8qmqRBHgG_0Y';

// Log de diagnóstico para verificar URLs e chaves (evitar mostrar a chave completa)
console.log('[supabase-compat] Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', Boolean(import.meta.env.VITE_SUPABASE_URL));
console.log('- VITE_SUPABASE_ANON_KEY disponível:', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', Boolean(import.meta.env.VITE_SUPABASE_SERVICE_KEY));

// Definição de tipos unificados para diagnósticos
export interface ClientDiagnosticResults {
  authConnection: boolean;
  databaseConnection: boolean;
  storageConnection: boolean;
  functionsConnection: boolean;
  realtimeConnection: boolean;
  baseConnection?: boolean;
  readPermission?: boolean;
  writePermission?: boolean;
  authSystem?: boolean;
  rpcFunctions?: boolean;
  supabase?: boolean;
}

export interface ServerDiagnosticResults {
  baseConnection: boolean;
  readPermission: boolean;
  writePermission: boolean;
  tables: Record<string, { exists: boolean, error: string | null }>;
  baseConnectionError?: string;
  readPermissionError?: string;
  writePermissionError?: string;
  readSample?: any;
}

// Instâncias do cliente Supabase (singleton pattern)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Função singleton para obter ou criar o cliente Supabase.
 * Garante que apenas uma instância do cliente é criada em toda a aplicação,
 * evitando problemas com múltiplas instâncias do GoTrueClient.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!_supabase) {
    console.log("[supabase-compat] Criando nova instância do cliente Supabase");
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'supabase.auth.token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-application-name': 'MuriciFleet-Web',
        },
      }
    });
  }
  return _supabase;
};

/**
 * Função singleton para obter ou criar o cliente Supabase Admin.
 * Este cliente tem permissões elevadas usando a service key.
 */
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!_supabaseAdmin) {
    console.log("[supabase-compat] Criando nova instância do cliente Supabase Admin");
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        storageKey: 'supabase.auth.admin.token',
        autoRefreshToken: true,
        persistSession: true
      }
    });
  }
  return _supabaseAdmin;
};

// Aliases para manter compatibilidade com código existente
export const createSupabaseClient = getSupabaseClient;
export const createSupabaseAdmin = getSupabaseAdminClient;

// Exportar instâncias únicas para uso geral no aplicativo
export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();

/**
 * Verifica se a conexão com o Supabase está funcionando
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    console.log('[supabase-compat] Verificando conexão com Supabase...');
    // Tentamos fazer uma busca simples para verificar a conexão
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (!error) {
      console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (users)');
      return true;
    }
    
    // Se falhar com a tabela users, tenta com outras tabelas
    try {
      const { error: abastecimentosError } = await supabase
        .from('abastecimentos')
        .select('count()', { count: 'exact', head: true });
      
      if (!abastecimentosError) {
        console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (abastecimentos)');
        return true;
      }
    } catch (e) {
      console.log('[supabase-compat] Falha ao verificar com tabela abastecimentos, tentando outra');
    }
    
    try {
      const { error: veiculosError } = await supabase
        .from('veiculos')
        .select('count()', { count: 'exact', head: true });
      
      if (!veiculosError) {
        console.log('[supabase-compat] Conexão com Supabase estabelecida com sucesso (veiculos)');
        return true;
      }
    } catch (e) {
      console.log('[supabase-compat] Falha ao verificar com tabela veiculos');
    }
    
    return false;
  } catch (err) {
    console.error('[supabase-compat] Erro ao verificar conexão com Supabase:', err);
    return false;
  }
};

// Aliases para manter compatibilidade com códigos que usavam supabase-client.ts
export const checkSupabaseConnection = checkConnection;

export const checkAllConnections = async () => {
  const supabaseConnected = await checkConnection();
  return {
    supabase: supabaseConnected,
    baseConnection: supabaseConnected,
    databaseConnection: supabaseConnected,
    authConnection: supabaseConnected,
    storageConnection: supabaseConnected,
    functionsConnection: supabaseConnected,
    realtimeConnection: supabaseConnected,
    readPermission: supabaseConnected,
    writePermission: supabaseConnected,
    authSystem: supabaseConnected,
    rpcFunctions: supabaseConnected
  };
};

/**
 * Busca registros de uma tabela com opções de filtro e ordenação
 */
export async function fetchRecords(
  table: string,
  options: { 
    columns?: string; 
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    let query = supabase.from(table).select(options.columns || '*');
    
    // Aplicar filtros
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && 'op' in value && 'value' in value) {
            // Filtro avançado com operador personalizado
            const { op, value: filterValue } = value as { op: string; value: any };
            switch (op) {
              case 'eq': query = query.eq(key, filterValue); break;
              case 'neq': query = query.neq(key, filterValue); break;
              case 'gt': query = query.gt(key, filterValue); break;
              case 'gte': query = query.gte(key, filterValue); break;
              case 'lt': query = query.lt(key, filterValue); break;
              case 'lte': query = query.lte(key, filterValue); break;
              case 'like': query = query.like(key, `%${filterValue}%`); break;
              case 'ilike': query = query.ilike(key, `%${filterValue}%`); break;
              case 'in': query = query.in(key, filterValue); break;
              default: query = query.eq(key, filterValue);
            }
          } else {
            // Filtro simples por igualdade
            query = query.eq(key, value);
          }
        }
      });
    }
    
    // Aplicar ordenação
    if (options.order) {
      const { column, ascending = true } = options.order;
      query = query.order(column, { ascending });
    }
    
    // Aplicar limite
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Executar a consulta
    const { data, error } = options.single 
      ? await query.single() 
      : await query;
    
    if (error) {
      console.error(`[supabase-compat] Erro ao buscar registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao buscar registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Insere um registro em uma tabela
 */
export async function insertRecord(
  table: string, 
  data: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    console.log(`[supabase-compat] Tentando inserir registro em ${table} com cliente padrão`);
    
    // Timeout para evitar que a operação fique presa indefinidamente
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: A operação demorou muito para responder')), 15000);
    });
    
    // Tentativa com cliente padrão
    const insertPromise = supabase.from(table).insert([data]).select();
    
    // Race entre o timeout e a inserção
    const result = await Promise.race([insertPromise, timeoutPromise]) as any;
    
    if (result.error) {
      console.error(`[supabase-compat] Erro ao inserir registro em ${table} com cliente padrão:`, result.error);
      
      // Tentativa com cliente admin como fallback
      console.log(`[supabase-compat] Tentando inserir registro em ${table} com cliente admin`);
      const { data: adminResult, error: adminError } = await supabaseAdmin
        .from(table)
        .insert([data])
        .select();
      
      if (adminError) {
        console.error(`[supabase-compat] Erro ao inserir registro em ${table} com cliente admin:`, adminError);
        return { success: false, error: adminError };
      }
      
      return { success: true, data: adminResult };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao inserir registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

// Alias para insertRecord
export const insertData = insertRecord;

/**
 * Atualiza um registro em uma tabela pelo ID
 */
export async function updateData(
  table: string,
  id: number | string,
  data: Record<string, any>,
  idField: string = 'id'
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq(idField, id)
      .select();
      
    if (error) {
      console.error(`[supabase-compat] Erro ao atualizar registro em ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao atualizar registro em ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Remove um registro de uma tabela pelo ID
 */
export async function deleteRecord(
  table: string,
  id: number | string,
  idField: string = 'id'
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idField, id);
      
    if (error) {
      console.error(`[supabase-compat] Erro ao excluir registro de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao excluir registro de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Remove múltiplos registros de uma tabela com base em filtros
 */
export async function deleteRecords(
  table: string,
  filter?: Record<string, any>
): Promise<{ success: boolean; error?: any }> {
  try {
    let query = supabase.from(table).delete();
    
    // Aplicar filtros
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { error } = await query;
      
    if (error) {
      console.error(`[supabase-compat] Erro ao excluir registros de ${table}:`, error);
      return { success: false, error };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[supabase-compat] Exceção ao excluir registros de ${table}:`, error);
    return { success: false, error: error instanceof Error ? error.message : error };
  }
}

/**
 * Função para chamar uma função Supabase com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T; error: any }>,
  maxRetries = 3,
  delay = 1000
): Promise<{ data: T | null; error: any }> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const { data, error } = await fn();
      
      if (!error) {
        return { data, error: null };
      }
      
      // Se tiver erro de conexão, tentar novamente
      if (error.code === 'PGRST301' || error.message?.includes('connection')) {
        retries++;
        console.log(`[supabase-compat] Tentativa ${retries}/${maxRetries} falhou, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Aumentar o delay a cada tentativa
      } else {
        // Se for um erro diferente de conexão, retornar imediatamente
        return { data: null, error };
      }
    } catch (err) {
      retries++;
      console.error(`[supabase-compat] Exceção na tentativa ${retries}/${maxRetries}:`, err);
      
      if (retries >= maxRetries) {
        return { data: null, error: err };
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Aumentar o delay a cada tentativa
    }
  }
  
  return { data: null, error: new Error(`Falha após ${maxRetries} tentativas`) };
}

// Nome dos buckets para anexos
export const BUDGET_ATTACHMENTS_BUCKET = 'budget-attachments';
export const INVOICE_ATTACHMENTS_BUCKET = 'notas-fiscais';

// Exportar informações de configuração para debugging
export const supabaseConfig = {
  url: supabaseUrl,
  anonKeyAvailable: Boolean(supabaseAnonKey),
  serviceKeyAvailable: Boolean(supabaseServiceKey)
};

/**
 * Função para sanitizar nomes de arquivos para uso seguro no Supabase Storage
 * Remove caracteres especiais, acentos e espaços
 * @param filename - Nome do arquivo original
 * @returns - Nome do arquivo sanitizado
 */
export const sanitizeFilename = (filename: string): string => {
  // Remover acentos e caracteres especiais
  const normalized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Substituir espaços e caracteres problemáticos por underscores
  return normalized
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Substitui caracteres não alfanuméricos
    .replace(/\s+/g, '_')              // Substitui espaços por underscores
    .replace(/__+/g, '_');             // Evita múltiplos underscores consecutivos
};

/**
 * Função para tentar criar um bucket se ele não existir
 * Essa função é principalmente para uso no servidor, pois requer a chave de serviço
 * 
 * @param bucketName - Nome do bucket a ser criado
 * @returns - true se o bucket foi criado ou já existe, false caso contrário
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  console.log(`Verificando se o bucket ${bucketName} existe...`);
  
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      return false;
    }
    
    // Se o bucket já existe, retornar true
    if (buckets?.some(bucket => bucket.name === bucketName)) {
      console.log(`Bucket ${bucketName} já existe.`);
      return true;
    }
    
    // Se o bucket não existe, tentar criá-lo
    console.log(`Bucket ${bucketName} não encontrado. Tentando criar...`);
    
    // Criar o bucket (requer permissões de serviço)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
    });
    
    if (error) {
      console.error(`Erro ao criar bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} criado com sucesso.`);
    return true;
  } catch (error) {
    console.error(`Erro ao verificar/criar bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Função para tentar usar um bucket existente ou um alternativo
 * 
 * NOTA: Essa função não tenta mais criar um bucket automaticamente devido a restrições de RLS no Supabase.
 * O bucket deve ser criado manualmente no Console do Supabase pelo administrador.
 * 
 * @returns - O nome do bucket que pode ser usado
 */
export const getBucketName = async (): Promise<string> => {
  console.log("Verificando buckets disponíveis...");
  
  try {
    // Verificar se algum bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      // Retornar o nome padrão mesmo com erro - tentaremos usar
      return BUDGET_ATTACHMENTS_BUCKET;
    }
    
    console.log("Buckets disponíveis:", buckets?.map(b => b.name));
    
    // Verificar se o bucket budget-attachments existe
    const budgetBucket = buckets?.find(bucket => bucket.name === BUDGET_ATTACHMENTS_BUCKET);
    
    if (budgetBucket) {
      console.log(`Bucket ${BUDGET_ATTACHMENTS_BUCKET} encontrado.`);
      return BUDGET_ATTACHMENTS_BUCKET;
    }
    
    // Se o bucket principal não existir, procurar qualquer bucket que possamos usar
    if (buckets && buckets.length > 0) {
      const firstBucket = buckets[0].name;
      console.log(`Bucket principal não encontrado. Usando bucket alternativo: ${firstBucket}`);
      return firstBucket;
    }
    
    // Se não encontrarmos nenhum bucket, retornar o nome padrão
    console.log(`Nenhum bucket encontrado. Tentando usar o bucket padrão: ${BUDGET_ATTACHMENTS_BUCKET}`);
    return BUDGET_ATTACHMENTS_BUCKET;
  } catch (error) {
    console.error("Erro ao verificar buckets:", error);
    return BUDGET_ATTACHMENTS_BUCKET;
  }
};

/**
 * Função para fazer upload de um arquivo para o Supabase Storage
 * Esta função agora usa um bucket existente ao invés de tentar criar um
 * 
 * @param file - O arquivo a ser enviado
 * @param path - O caminho dentro do bucket onde o arquivo será armazenado
 * @param bucketName - (Opcional) Nome específico do bucket. Se não fornecido, usa o método getBucketName
 * @returns - A URL pública do arquivo armazenado
 */
export const uploadFileToSupabase = async (file: File, path: string, bucketName?: string): Promise<string> => {
  try {
    // Verificar se o arquivo é válido
    if (!file) {
      throw new Error('Arquivo inválido');
    }
    
    // Obter o nome do bucket a ser usado
    const bucket = bucketName || await getBucketName();
    console.log(`Usando bucket para upload: ${bucket}`);
    
    // Escolher o cliente Supabase para usar (admin se disponível, cliente normal caso contrário)
    const client = supabaseAdmin || supabase;
    
    // Fazer upload do arquivo para o Supabase Storage
    console.log(`Tentando fazer upload para ${bucket}/${path} usando ${supabaseAdmin ? 'chave de serviço' : 'chave anônima'}`);
    
    // Primeira tentativa com o cliente escolhido
    let uploadResult;
    try {
      uploadResult = await client.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });
    } catch (err) {
      console.warn('Erro na primeira tentativa de upload, tentando com cliente alternativo:', err);
      // Se falhar e tivermos um cliente alternativo, tente novamente
      if (supabaseAdmin && client === supabase) {
        uploadResult = await supabaseAdmin.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true
          });
      } else {
        // Se não tivermos um cliente alternativo ou já estivermos usando o admin, propague o erro
        throw err;
      }
    }
    
    const { data, error } = uploadResult;

    if (error) {
      console.error('Erro detalhado do Supabase Storage:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }

    // Verificar se o upload foi bem-sucedido
    if (!data || !data.path) {
      throw new Error('Upload falhou, dados não retornados pelo Supabase');
    }
    
    console.log(`Upload concluído com sucesso para ${bucket}/${path}`);

    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!publicUrl) {
      throw new Error('Não foi possível obter URL pública do arquivo');
    }
    
    console.log(`URL pública obtida: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload para o Supabase Storage:', error);
    throw error;
  }
};

/**
 * Função para registrar um anexo no banco de dados
 * @param budgetRequestId - ID da solicitação de orçamento
 * @param baseId - ID da base
 * @param baseName - Nome da base
 * @param fileName - Nome do arquivo
 * @param filePath - Caminho do arquivo no storage
 * @param storageUrl - URL pública do arquivo
 * @param uploaderId - ID do usuário que fez o upload
 * @param uploaderName - Nome do usuário que fez o upload
 * @param attachmentType - Tipo de anexo ('budget' ou 'invoice')
 * @returns - O registro do anexo
 */
export const registerAttachmentMetadata = async (
  budgetRequestId: number,
  baseId: number,
  baseName: string,
  fileName: string,
  filePath: string,
  storageUrl: string,
  uploaderId: number | null = null,
  uploaderName: string | null = null,
  attachmentType: 'budget' | 'invoice' = 'budget'
) => {
  try {
    // Inserir registro de metadados do anexo no banco de dados
    const { data, error } = await supabase
      .from('budget_attachments')
      .insert([
        {
          budget_request_id: budgetRequestId,
          base_id: baseId,
          base_name: baseName,
          file_name: fileName,
          file_path: filePath,
          storage_url: storageUrl,
          uploader_id: uploaderId,
          uploader_name: uploaderName,
          attachment_type: attachmentType,
          file_type: fileName.split('.').pop() || '',
          file_size: 0, // Não temos essa informação no momento
          is_active: true
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Erro ao registrar metadados do anexo:', error);
    throw error;
  }
};

/**
 * Função específica para upload de documentos de orçamento
 * 
 * @param file - O arquivo do orçamento (PDF/JPG/PNG)
 * @param budgetRequestId - ID da solicitação de orçamento (0 se for uma nova solicitação)
 * @param baseId - ID da base
 * @param baseName - Nome da base
 * @param uploaderId - ID do usuário que está fazendo o upload
 * @param uploaderName - Nome do usuário que está fazendo o upload
 * @returns - Objeto com a URL do documento e os metadados registrados
 */
export const uploadBudgetFile = async (
  file: File,
  budgetRequestId: number,
  baseId: number,
  baseName: string,
  uploaderId: number | null = null,
  uploaderName: string | null = null
): Promise<{ url: string, metadata: any }> => {
  try {
    // Verificar se o arquivo é válido
    if (!file) {
      throw new Error('Arquivo de orçamento inválido');
    }
    
    // Garantir que o bucket de anexos de orçamento exista
    await ensureBucketExists(BUDGET_ATTACHMENTS_BUCKET);
    
    // Criar um caminho único para o arquivo no Supabase Storage
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueId = Date.now().toString();
    const sanitizedFileName = sanitizeFilename(file.name);
    console.log(`Nome do arquivo original: ${file.name}`);
    console.log(`Nome do arquivo sanitizado: ${sanitizedFileName}`);
    const filePath = `base-${baseId}/request-${budgetRequestId || 'new'}/${uniqueId}-${sanitizedFileName}`;
    
    // Fazer upload do arquivo para o bucket específico de orçamentos
    const storageUrl = await uploadFileToSupabase(file, filePath, BUDGET_ATTACHMENTS_BUCKET);
    
    // Registrar os metadados do anexo no banco de dados (apenas se budgetRequestId > 0)
    let metadata = null;
    if (budgetRequestId > 0) {
      metadata = await registerAttachmentMetadata(
        budgetRequestId,
        baseId,
        baseName,
        file.name,
        filePath,
        storageUrl,
        uploaderId,
        uploaderName,
        'budget'
      );
    }
    
    return {
      url: storageUrl,
      metadata
    };
  } catch (error) {
    console.error('Erro ao fazer upload do documento de orçamento:', error);
    throw error;
  }
};

/**
 * Função específica para upload de notas fiscais
 * 
 * @param file - O arquivo da nota fiscal (PDF/JPG/PNG)
 * @param budgetRequestId - ID da solicitação de orçamento relacionada
 * @param baseId - ID da base
 * @param baseName - Nome da base
 * @param uploaderId - ID do usuário que está fazendo o upload
 * @param uploaderName - Nome do usuário que está fazendo o upload
 * @returns - Objeto com a URL da nota fiscal e os metadados registrados
 */
export const uploadInvoiceFile = async (
  file: File,
  budgetRequestId: number,
  baseId: number,
  baseName: string,
  uploaderId: number | null = null,
  uploaderName: string | null = null
): Promise<{ url: string, metadata: any }> => {
  try {
    // Verificar se o arquivo é válido
    if (!file) {
      throw new Error('Arquivo de nota fiscal inválido');
    }
    
    // Garantir que o bucket de notas fiscais exista
    await ensureBucketExists(INVOICE_ATTACHMENTS_BUCKET);
    
    // Criar um caminho único para o arquivo no Supabase Storage
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueId = Date.now().toString();
    const sanitizedFileName = sanitizeFilename(file.name);
    console.log(`Nome do arquivo original: ${file.name}`);
    console.log(`Nome do arquivo sanitizado: ${sanitizedFileName}`);
    const filePath = `base-${baseId}/request-${budgetRequestId}/${uniqueId}-${sanitizedFileName}`;
    
    // Fazer upload do arquivo para o bucket específico de notas fiscais
    const storageUrl = await uploadFileToSupabase(file, filePath, INVOICE_ATTACHMENTS_BUCKET);
    
    // Registrar os metadados do anexo no banco de dados
    const metadata = await registerAttachmentMetadata(
      budgetRequestId,
      baseId,
      baseName,
      file.name,
      filePath,
      storageUrl,
      uploaderId,
      uploaderName,
      'invoice'
    );
    
    return {
      url: storageUrl,
      metadata
    };
  } catch (error) {
    console.error('Erro ao fazer upload da nota fiscal:', error);
    throw error;
  }
};

/**
 * Função para limpar tabelas no Supabase
 * Útil apenas para ambientes de desenvolvimento e testes
 * @param tableNames - Lista de nomes de tabelas para limpar
 * @returns - Status da operação para cada tabela
 */
export const limparTodosOsDados = async (tableNames: string[]): Promise<any> => {
  const resultados: Record<string, any> = {};
  
  for (const tableName of tableNames) {
    try {
      console.log(`Limpando tabela: ${tableName}`);
      
      // Tentar usar o cliente admin se disponível, caso contrário usar o cliente normal
      const client = supabaseAdmin || supabase;
      
      // Executar DELETE sem WHERE para limpar toda a tabela
      const { error } = await client.from(tableName).delete().not('id', 'is', null);
      
      if (error) {
        console.error(`Erro ao limpar tabela ${tableName}:`, error);
        resultados[tableName] = { sucesso: false, erro: error.message };
      } else {
        console.log(`Tabela ${tableName} limpa com sucesso`);
        resultados[tableName] = { sucesso: true };
      }
    } catch (erro) {
      console.error(`Exceção ao limpar tabela ${tableName}:`, erro);
      resultados[tableName] = { 
        sucesso: false, 
        erro: erro instanceof Error ? erro.message : String(erro) 
      };
    }
  }
  
  return resultados;
};

// Exportação padrão
export default supabase;