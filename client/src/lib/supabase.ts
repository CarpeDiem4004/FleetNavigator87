// Importar o cliente Supabase do arquivo unificado
import { getSupabaseClient, getSupabaseAdminClient, supabase, supabaseAdmin } from './supabaseClient';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.');
}

// Informações de configuração para debugging
console.log('Verificando variáveis de ambiente do Supabase:');
console.log('- VITE_SUPABASE_URL disponível:', Boolean(supabaseUrl));
console.log('- VITE_SUPABASE_ANON_KEY disponível:', Boolean(supabaseAnonKey));
console.log('- VITE_SUPABASE_SERVICE_KEY disponível:', Boolean(supabaseServiceKey));

if (supabaseServiceKey) {
  // Mostrar apenas os primeiros 10 caracteres para debug, mas não exibir a chave completa
  console.log('Supabase Service Key (primeiros 10 caracteres):', supabaseServiceKey.substring(0, 10) + '...');
}

// Exportar informações de configuração para debugging
export const supabaseConfig = {
  url: supabaseUrl,
  anonKeyAvailable: Boolean(supabaseAnonKey),
  serviceKeyAvailable: Boolean(supabaseServiceKey)
};

console.log('Configuração Supabase Cliente:', supabaseConfig);

// Nome dos buckets para anexos
export const BUDGET_ATTACHMENTS_BUCKET = 'budget-attachments';
export const INVOICE_ATTACHMENTS_BUCKET = 'notas-fiscais';

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
    // Obter instância do cliente Supabase
    const supabase = getSupabaseClient();
    
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
    // Obter instância do cliente Supabase
    const supabase = getSupabaseClient();
    
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
    
    // Obter os clientes Supabase
    const supabase = getSupabaseClient();
    const supabaseAdmin = getSupabaseAdminClient();
    
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
    // Obter cliente Supabase
    const supabase = getSupabaseClient();
    
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