/**
 * Script para migrar anexos de solicitações de orçamento do formato blob para o Supabase Storage
 * 
 * Este script:
 * 1. Identifica solicitações de orçamento com anexos no formato blob
 * 2. Fornece uma interface para baixar e fazer upload para o Supabase Storage
 * 3. Atualiza os registros no banco de dados com as novas URLs de armazenamento
 * 
 * IMPORTANTE: Este script deve ser executado em um ambiente onde as URLs blob são acessíveis,
 * ou seja, no mesmo navegador e domínio onde as solicitações foram criadas.
 */

// Importações necessárias
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Usamos a chave de serviço para permissões completas
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Nome do bucket para armazenar os anexos
const STORAGE_BUCKET = 'budget-attachments';

/**
 * Função para verificar ou criar o bucket de armazenamento
 */
async function ensureStorageBucket() {
  try {
    // Verificar se o bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Criar o bucket se não existir
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // Definir como público para facilitar o acesso
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`Bucket ${STORAGE_BUCKET} criado com sucesso:`, data);
    } else {
      console.log(`Bucket ${STORAGE_BUCKET} já existe.`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    return false;
  }
}

/**
 * Função para obter anexos de orçamento em formato blob
 */
async function getBlobAttachments() {
  try {
    // Consulta para encontrar solicitações com anexos em formato blob
    const query = `
      SELECT 
        id,
        title,
        budget_file_name,
        budget_file_url,
        base_id,
        base_name,
        requester_id,
        requester_name
      FROM 
        campinas_budget_requests
      WHERE 
        budget_file_url IS NOT NULL AND 
        budget_file_url LIKE 'blob:%'
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar anexos blob:', error);
    throw error;
  }
}

/**
 * Função para baixar um arquivo a partir de uma URL blob
 * 
 * NOTA: Esta função NÃO funciona em um ambiente Node.js padrão, pois URLs blob 
 * são específicas do navegador. Este é apenas um esboço do que seria necessário fazer
 * no navegador para baixar o arquivo.
 */
async function downloadBlobFile(blobUrl) {
  try {
    console.log(`Tentando baixar arquivo da URL blob: ${blobUrl}`);
    
    // Em um ambiente de navegador, você usaria fetch:
    // const response = await fetch(blobUrl);
    // const blob = await response.blob();
    // return blob;
    
    // Em um ambiente Node.js, isso não funciona diretamente
    // Você precisa implementar um mecanismo para baixar o arquivo
    // do navegador e então processá-lo aqui
    
    throw new Error('Não é possível baixar URLs blob diretamente em Node.js. ' + 
                    'Este processo deve ser executado em um navegador.');
  } catch (error) {
    console.error(`Erro ao baixar arquivo de ${blobUrl}:`, error);
    throw error;
  }
}

/**
 * Função para fazer upload de um arquivo para o Supabase Storage
 */
async function uploadFileToSupabase(fileBuffer, filePath, contentType) {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error(`Erro ao fazer upload para ${filePath}:`, error);
    throw error;
  }
}

/**
 * Função para atualizar o registro de solicitação com a nova URL
 */
async function updateBudgetRequestUrl(requestId, newUrl) {
  try {
    const query = `
      UPDATE campinas_budget_requests
      SET 
        budget_file_url = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, title, budget_file_url
    `;
    
    const result = await pool.query(query, [newUrl, requestId]);
    return result.rows[0];
  } catch (error) {
    console.error(`Erro ao atualizar URL para solicitação ${requestId}:`, error);
    throw error;
  }
}

/**
 * Função para registrar o anexo na tabela budget_attachments
 */
async function registerAttachmentMetadata(requestData, storageUrl, filePath) {
  try {
    const query = `
      INSERT INTO budget_attachments (
        budget_request_id,
        base_id,
        base_name,
        file_name,
        file_path,
        storage_url,
        uploader_id,
        uploader_name,
        attachment_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const params = [
      requestData.id,
      requestData.base_id,
      requestData.base_name,
      requestData.budget_file_name,
      filePath,
      storageUrl,
      requestData.requester_id,
      requestData.requester_name,
      'budget'
    ];
    
    const result = await pool.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error(`Erro ao registrar metadados do anexo para solicitação ${requestData.id}:`, error);
    throw error;
  }
}

/**
 * Função principal para migrar anexos
 */
async function migrateAttachments() {
  try {
    // Verificar/criar bucket
    const bucketReady = await ensureStorageBucket();
    if (!bucketReady) {
      throw new Error('Não foi possível preparar o bucket de armazenamento');
    }
    
    // Obter anexos a serem migrados
    const attachments = await getBlobAttachments();
    console.log(`Encontrados ${attachments.length} anexos para migração.`);
    
    if (attachments.length === 0) {
      console.log('Nenhum anexo para migrar.');
      return;
    }
    
    // Aqui você deve implementar a lógica para baixar os arquivos blob
    // e depois fazer upload para o Supabase Storage
    console.log('IMPORTANTE: Os anexos em formato blob não podem ser baixados automaticamente via Node.js.');
    console.log('Este script deve ser adaptado para um ambiente onde as URLs blob são acessíveis,');
    console.log('como uma extensão de navegador ou uma aplicação web.');
    
    // Exibir informações dos anexos para processamento manual
    console.log('\nLista de anexos para processamento manual:');
    attachments.forEach((attachment, index) => {
      console.log(`\n${index + 1}. Solicitação ID: ${attachment.id}`);
      console.log(`   Título: ${attachment.title}`);
      console.log(`   Arquivo: ${attachment.budget_file_name}`);
      console.log(`   URL Blob: ${attachment.budget_file_url}`);
      console.log(`   Base: ${attachment.base_name} (ID: ${attachment.base_id})`);
      
      // Gerar caminho para upload
      const filePath = `${attachment.base_id}/${attachment.id}/${uuidv4()}-${attachment.budget_file_name}`;
      console.log(`   Caminho Sugerido: ${filePath}`);
    });
    
    console.log('\nPara migrar manualmente:');
    console.log('1. Acesse cada solicitação na interface onde a URL blob é válida');
    console.log('2. Baixe o arquivo manualmente');
    console.log('3. Faça upload para o Supabase Storage');
    console.log('4. Execute o script de atualização de URLs no banco de dados');
  } catch (error) {
    console.error('Erro durante a migração de anexos:', error);
  } finally {
    // Fechar a conexão com o banco
    pool.end();
  }
}

/**
 * Função para migrar um único anexo (versão mockup para demonstração)
 */
async function migrateSingleAttachment(requestId, localFilePath, contentType) {
  try {
    // Obter informações da solicitação
    const query = `
      SELECT 
        id,
        title,
        budget_file_name,
        budget_file_url,
        base_id,
        base_name,
        requester_id,
        requester_name
      FROM 
        campinas_budget_requests
      WHERE 
        id = $1
    `;
    
    const result = await pool.query(query, [requestId]);
    if (result.rows.length === 0) {
      throw new Error(`Solicitação ID ${requestId} não encontrada.`);
    }
    
    const requestData = result.rows[0];
    
    // Ler o arquivo local
    const fileBuffer = fs.readFileSync(localFilePath);
    
    // Definir caminho de armazenamento
    const fileName = path.basename(localFilePath);
    const filePath = `${requestData.base_id}/${requestData.id}/${uuidv4()}-${fileName}`;
    
    // Fazer upload para o Supabase
    const storageUrl = await uploadFileToSupabase(fileBuffer, filePath, contentType);
    
    // Atualizar o registro da solicitação
    const updatedRequest = await updateBudgetRequestUrl(requestId, storageUrl);
    
    // Registrar metadados do anexo
    const attachmentRecord = await registerAttachmentMetadata(requestData, storageUrl, filePath);
    
    console.log(`Migração completa para solicitação ${requestId}.`);
    console.log(`Novo registro de anexo criado com ID ${attachmentRecord.id}.`);
    console.log(`URL atualizada: ${updatedRequest.budget_file_url}`);
    
    return {
      success: true,
      requestId,
      newUrl: storageUrl,
      attachmentId: attachmentRecord.id
    };
  } catch (error) {
    console.error(`Erro ao migrar anexo para solicitação ${requestId}:`, error);
    return {
      success: false,
      requestId,
      error: error.message
    };
  }
}

/**
 * Função para implementar um assistente web de migração
 * 
 * Esta função retorna código HTML que pode ser usado para criar uma
 * interface web para migrar anexos de forma interativa.
 */
function generateMigrationAssistantHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assistente de Migração de Anexos</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .card-title {
      font-weight: 600;
      font-size: 18px;
    }
    .file-info {
      margin: 10px 0;
    }
    .status {
      font-weight: 600;
    }
    .status-pending {
      color: #f59e0b;
    }
    .status-success {
      color: #10b981;
    }
    .status-error {
      color: #ef4444;
    }
    .actions {
      margin-top: 16px;
    }
    button {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #1d4ed8;
    }
    button:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
    .button-secondary {
      background-color: #6b7280;
    }
    .button-secondary:hover {
      background-color: #4b5563;
    }
    .button-success {
      background-color: #10b981;
    }
    .button-success:hover {
      background-color: #059669;
    }
    input[type="file"] {
      display: none;
    }
    .file-upload-label {
      display: inline-block;
      background-color: #6b7280;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    .file-upload-label:hover {
      background-color: #4b5563;
    }
    .progress-container {
      margin-top: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar {
      height: 24px;
      background-color: #2563eb;
      text-align: center;
      color: white;
      line-height: 24px;
      transition: width 0.3s;
    }
    .hidden {
      display: none;
    }
    .log-container {
      margin-top: 20px;
      background-color: #f3f4f6;
      padding: 16px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      font-family: monospace;
    }
    .log-entry {
      margin: 4px 0;
    }
    .log-info {
      color: #2563eb;
    }
    .log-error {
      color: #ef4444;
    }
    .log-success {
      color: #10b981;
    }
  </style>
</head>
<body>
  <h1>Assistente de Migração de Anexos</h1>
  
  <div class="card">
    <div class="card-header">
      <div class="card-title">Instruções</div>
    </div>
    <p>
      Este assistente ajuda a migrar anexos de solicitações de orçamento do formato blob para o Supabase Storage.
      Siga os seguintes passos:
    </p>
    <ol>
      <li>Clique em "Buscar Anexos" para verificar quais solicitações possuem anexos em formato blob.</li>
      <li>Para cada solicitação, baixe o anexo clicando no botão "Visualizar" na interface original.</li>
      <li>Em seguida, selecione o arquivo baixado clicando em "Escolher Arquivo".</li>
      <li>Clique em "Fazer Upload" para migrar o anexo para o Supabase Storage.</li>
      <li>Repita o processo para todos os anexos listados.</li>
    </ol>
  </div>
  
  <div class="card">
    <div class="card-header">
      <div class="card-title">Progresso da Migração</div>
    </div>
    <div class="actions">
      <button id="fetchAttachmentsBtn">Buscar Anexos</button>
      <span id="totalAttachments" class="status"></span>
    </div>
    <div id="progressContainer" class="progress-container hidden">
      <div id="progressBar" class="progress-bar" style="width: 0%">0%</div>
    </div>
  </div>
  
  <div id="attachmentsList"></div>
  
  <div id="logContainer" class="log-container hidden">
    <div class="card-title">Log de Operações</div>
    <div id="logEntries"></div>
  </div>

  <script>
    // Este é o script que seria executado no navegador
    // para gerenciar a migração de anexos
    
    // Variáveis globais
    let attachments = [];
    let migratedCount = 0;
    
    // Elementos DOM
    const fetchBtn = document.getElementById('fetchAttachmentsBtn');
    const totalAttachmentsSpan = document.getElementById('totalAttachments');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const attachmentsList = document.getElementById('attachmentsList');
    const logContainer = document.getElementById('logContainer');
    const logEntries = document.getElementById('logEntries');
    
    // Função para buscar anexos no formato blob
    async function fetchBlobAttachments() {
      log('info', 'Buscando anexos em formato blob...');
      
      try {
        // Aqui você faria uma chamada à API para buscar os anexos
        // Em um ambiente real, esta seria uma chamada AJAX para o backend
        
        // Simulação de dados para demonstração
        const demoAttachments = [
          {
            id: 1,
            title: 'Solicitação de compra de peças',
            budget_file_name: 'orcamento_pecas.pdf',
            budget_file_url: 'blob:https://exemplo.com/1234-5678',
            base_id: 2,
            base_name: 'Base Campinas',
            requester_id: 3,
            requester_name: 'João Silva'
          },
          {
            id: 2,
            title: 'Manutenção preventiva',
            budget_file_name: 'manutencao.jpg',
            budget_file_url: 'blob:https://exemplo.com/8765-4321',
            base_id: 2,
            base_name: 'Base Campinas',
            requester_id: 4,
            requester_name: 'Maria Oliveira'
          }
        ];
        
        attachments = demoAttachments;
        displayAttachments(attachments);
        updateProgress();
        
        log('success', `Encontrados ${attachments.length} anexos para migração.`);
      } catch (error) {
        log('error', `Erro ao buscar anexos: ${error.message}`);
      }
    }
    
    // Função para exibir anexos na interface
    function displayAttachments(attachments) {
      attachmentsList.innerHTML = '';
      
      if (attachments.length === 0) {
        attachmentsList.innerHTML = '<div class="card"><p>Nenhum anexo encontrado para migração.</p></div>';
        return;
      }
      
      totalAttachmentsSpan.textContent = ` (${migratedCount}/${attachments.length})`;
      progressContainer.classList.remove('hidden');
      logContainer.classList.remove('hidden');
      
      attachments.forEach((attachment, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `attachment-${attachment.id}`;
        
        let status = 'Pendente';
        let statusClass = 'status-pending';
        
        if (attachment.migrated) {
          status = 'Migrado';
          statusClass = 'status-success';
        } else if (attachment.error) {
          status = 'Erro';
          statusClass = 'status-error';
        }
        
        card.innerHTML = \`
          <div class="card-header">
            <div class="card-title">\${attachment.title}</div>
            <div class="status \${statusClass}">\${status}</div>
          </div>
          <div class="file-info">
            <p><strong>ID:</strong> \${attachment.id}</p>
            <p><strong>Arquivo:</strong> \${attachment.budget_file_name}</p>
            <p><strong>Base:</strong> \${attachment.base_name} (ID: \${attachment.base_id})</p>
            <p><strong>URL Original:</strong> \${attachment.budget_file_url}</p>
            \${attachment.newUrl ? \`<p><strong>Nova URL:</strong> \${attachment.newUrl}</p>\` : ''}
          </div>
          <div class="actions">
            \${!attachment.migrated ? \`
              <input type="file" id="file-\${attachment.id}" class="file-input" />
              <label for="file-\${attachment.id}" class="file-upload-label">Escolher Arquivo</label>
              <button class="upload-btn" data-id="\${attachment.id}" \${!attachment.fileSelected ? 'disabled' : ''}>Fazer Upload</button>
            \` : \`
              <button class="button-success">Já Migrado</button>
            \`}
          </div>
        \`;
        
        attachmentsList.appendChild(card);
      });
      
      // Adicionar event listeners
      document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', handleFileSelection);
      });
      
      document.querySelectorAll('.upload-btn').forEach(button => {
        button.addEventListener('click', handleFileUpload);
      });
    }
    
    // Função para lidar com a seleção de arquivo
    function handleFileSelection(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const attachmentId = event.target.id.split('-')[1];
      const attachment = attachments.find(a => a.id == attachmentId);
      
      if (attachment) {
        attachment.fileSelected = true;
        attachment.fileToUpload = file;
        
        const uploadBtn = document.querySelector(\`.upload-btn[data-id="\${attachmentId}"]\`);
        if (uploadBtn) {
          uploadBtn.disabled = false;
        }
        
        log('info', \`Arquivo selecionado para solicitação #\${attachmentId}: \${file.name}\`);
      }
    }
    
    // Função para lidar com o upload de arquivo
    async function handleFileUpload(event) {
      const attachmentId = event.target.getAttribute('data-id');
      const attachment = attachments.find(a => a.id == attachmentId);
      
      if (!attachment || !attachment.fileToUpload) {
        log('error', \`Nenhum arquivo selecionado para solicitação #\${attachmentId}\`);
        return;
      }
      
      const uploadBtn = event.target;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Enviando...';
      
      log('info', \`Iniciando upload do arquivo para solicitação #\${attachmentId}...\`);
      
      try {
        // Aqui você faria o upload real para o Supabase
        // Em um ambiente real, isso seria uma chamada AJAX para o backend
        
        // Simulação de upload
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simular resposta bem-sucedida
        const response = {
          success: true,
          requestId: attachmentId,
          newUrl: \`https://example-storage.supabase.co/budget-attachments/\${attachment.base_id}/\${attachmentId}/\${attachment.budget_file_name}\`,
          attachmentId: 100 + parseInt(attachmentId)
        };
        
        // Atualizar dados do anexo
        attachment.migrated = true;
        attachment.newUrl = response.newUrl;
        migratedCount++;
        
        // Atualizar interface
        displayAttachments(attachments);
        updateProgress();
        
        log('success', \`Anexo da solicitação #\${attachmentId} migrado com sucesso!\`);
      } catch (error) {
        attachment.error = error.message;
        
        log('error', \`Erro ao migrar anexo da solicitação #\${attachmentId}: \${error.message}\`);
        
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Tentar Novamente';
      }
    }
    
    // Função para atualizar a barra de progresso
    function updateProgress() {
      const percentage = attachments.length > 0 
        ? Math.round((migratedCount / attachments.length) * 100) 
        : 0;
      
      progressBar.style.width = \`\${percentage}%\`;
      progressBar.textContent = \`\${percentage}%\`;
      
      totalAttachmentsSpan.textContent = ` (\${migratedCount}/\${attachments.length})`;
    }
    
    // Função para registrar eventos no log
    function log(type, message) {
      const logEntry = document.createElement('div');
      logEntry.className = \`log-entry log-\${type}\`;
      
      const timestamp = new Date().toLocaleTimeString();
      logEntry.textContent = \`[\${timestamp}] \${message}\`;
      
      logEntries.appendChild(logEntry);
      logEntries.scrollTop = logEntries.scrollHeight;
      
      logContainer.classList.remove('hidden');
    }
    
    // Event listeners
    fetchBtn.addEventListener('click', fetchBlobAttachments);
    
    // Inicialização
    log('info', 'Assistente de migração inicializado.');
  </script>
</body>
</html>`;
}

// Se este script for executado diretamente (não importado)
if (require.main === module) {
  // Chamar a função principal
  migrateAttachments()
    .then(() => {
      console.log('Processo concluído.');
    })
    .catch(error => {
      console.error('Erro na execução principal:', error);
      process.exit(1);
    });
}

// Exportar funções úteis
module.exports = {
  migrateAttachments,
  migrateSingleAttachment,
  ensureStorageBucket,
  getBlobAttachments,
  uploadFileToSupabase,
  updateBudgetRequestUrl,
  registerAttachmentMetadata,
  generateMigrationAssistantHtml
};