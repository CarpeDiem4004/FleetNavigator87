import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.');
}

// Criar o cliente Supabase com a chave anônima (para uso no navegador)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Nome do bucket para anexos de orçamentos
export const BUDGET_ATTACHMENTS_BUCKET = 'budget-attachments';

/**
 * Função para fazer upload de um arquivo para o Supabase Storage
 * @param file - O arquivo a ser enviado
 * @param path - O caminho dentro do bucket onde o arquivo será armazenado
 * @returns - A URL pública do arquivo armazenado
 */
export const uploadFileToSupabase = async (file: File, path: string): Promise<string> => {
  try {
    // Verificar se o arquivo é válido
    if (!file) {
      throw new Error('Arquivo inválido');
    }

    // Fazer upload do arquivo para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUDGET_ATTACHMENTS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from(BUDGET_ATTACHMENTS_BUCKET)
      .getPublicUrl(path);

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