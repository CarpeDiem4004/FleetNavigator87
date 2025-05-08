/**
 * Script para criar uma rota de servidor para o assistente de migração de anexos
 * 
 * Este script deve ser usado para adicionar uma rota ao servidor Express
 * que fornece uma interface web para migrar anexos do formato blob para o Supabase Storage
 */

const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configurações
const STORAGE_BUCKET = 'budget-attachments';
const TEMP_UPLOAD_DIR = path.join(__dirname, 'tmp_uploads');

// Garantir que o diretório temporário exista
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

// Configurar multer para uploads de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Cliente do Supabase
let supabase;
function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  return supabase;
}

/**
 * Função para verificar ou criar o bucket de armazenamento
 */
async function ensureStorageBucket() {
  try {
    const supabase = getSupabaseClient();
    
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Criar o bucket se não existir
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`Bucket ${STORAGE_BUCKET} criado com sucesso.`);
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
 * Função para fazer upload de um arquivo para o Supabase Storage
 */
async function uploadFileToSupabase(filePath, destinationPath, contentType) {
  try {
    const supabase = getSupabaseClient();
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Fazer upload para o Supabase
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(destinationPath, fileBuffer, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(destinationPath);
    
    return publicUrl;
  } catch (error) {
    console.error(`Erro ao fazer upload para ${destinationPath}:`, error);
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
    // Primeiro verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'budget_attachments'
      ) AS "exists";
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('A tabela budget_attachments não existe. Execute o script SQL para criá-la primeiro.');
      throw new Error('Tabela budget_attachments não existe');
    }
    
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
 * Código HTML do assistente de migração
 */
function generateAssistantHtml() {
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
    .back-link {
      display: inline-block;
      margin-top: 20px;
      color: #2563eb;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
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
      <li>Para cada solicitação, baixe o anexo acessando a página original onde ele foi enviado.</li>
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
  
  <a href="/" class="back-link">Voltar ao Painel Principal</a>

  <script>
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
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Buscando...';
      
      try {
        const response = await fetch('/api/attachment-migration/attachments');
        
        if (!response.ok) {
          throw new Error(\`Erro ao buscar anexos: \${response.status} \${response.statusText}\`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Erro ao buscar anexos');
        }
        
        attachments = data.attachments.map(attachment => ({
          ...attachment,
          migrated: false,
          fileSelected: false
        }));
        
        displayAttachments(attachments);
        updateProgress();
        
        log('success', \`Encontrados \${attachments.length} anexos para migração.\`);
      } catch (error) {
        log('error', \`Erro ao buscar anexos: \${error.message}\`);
      } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'Buscar Anexos';
      }
    }
    
    // Função para exibir anexos na interface
    function displayAttachments(attachments) {
      attachmentsList.innerHTML = '';
      
      if (attachments.length === 0) {
        attachmentsList.innerHTML = '<div class="card"><p>Nenhum anexo encontrado para migração.</p></div>';
        return;
      }
      
      totalAttachmentsSpan.textContent = \` (\${migratedCount}/\${attachments.length})\`;
      progressContainer.classList.remove('hidden');
      logContainer.classList.remove('hidden');
      
      attachments.forEach((attachment, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = \`attachment-\${attachment.id}\`;
        
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
            \${attachment.new_url ? \`<p><strong>Nova URL:</strong> \${attachment.new_url}</p>\` : ''}
            \${attachment.error ? \`<p><strong>Erro:</strong> <span class="status-error">\${attachment.error}</span></p>\` : ''}
          </div>
          <div class="actions">
            \${!attachment.migrated ? \`
              <form id="form-\${attachment.id}" enctype="multipart/form-data" class="upload-form">
                <input type="hidden" name="requestId" value="\${attachment.id}" />
                <input type="file" id="file-\${attachment.id}" name="attachmentFile" class="file-input" />
                <label for="file-\${attachment.id}" class="file-upload-label">Escolher Arquivo</label>
                <button type="submit" class="upload-btn" data-id="\${attachment.id}" disabled>Fazer Upload</button>
              </form>
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
      
      document.querySelectorAll('.upload-form').forEach(form => {
        form.addEventListener('submit', handleFileUpload);
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
        
        const uploadBtn = document.querySelector(\`#form-\${attachmentId} .upload-btn\`);
        if (uploadBtn) {
          uploadBtn.disabled = false;
        }
        
        log('info', \`Arquivo selecionado para solicitação #\${attachmentId}: \${file.name}\`);
      }
    }
    
    // Função para lidar com o upload de arquivo
    async function handleFileUpload(event) {
      event.preventDefault();
      
      const form = event.target;
      const formData = new FormData(form);
      
      const requestId = formData.get('requestId');
      const file = formData.get('attachmentFile');
      
      if (!requestId || !file) {
        log('error', \`Dados incompletos para upload da solicitação #\${requestId}\`);
        return;
      }
      
      const attachment = attachments.find(a => a.id == requestId);
      if (!attachment) {
        log('error', \`Solicitação #\${requestId} não encontrada\`);
        return;
      }
      
      const uploadBtn = form.querySelector('.upload-btn');
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Enviando...';
      
      log('info', \`Iniciando upload do arquivo para solicitação #\${requestId}...\`);
      
      try {
        const response = await fetch('/api/attachment-migration/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(\`Erro na requisição: \${response.status} \${response.statusText}\`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Erro durante o upload');
        }
        
        // Atualizar dados do anexo
        attachment.migrated = true;
        attachment.new_url = result.storageUrl;
        migratedCount++;
        
        // Atualizar interface
        displayAttachments(attachments);
        updateProgress();
        
        log('success', \`Anexo da solicitação #\${requestId} migrado com sucesso!\`);
      } catch (error) {
        attachment.error = error.message;
        log('error', \`Erro ao migrar anexo da solicitação #\${requestId}: \${error.message}\`);
        
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Tentar Novamente';
        
        // Atualizar interface para mostrar o erro
        displayAttachments(attachments);
      }
    }
    
    // Função para atualizar a barra de progresso
    function updateProgress() {
      const percentage = attachments.length > 0 
        ? Math.round((migratedCount / attachments.length) * 100) 
        : 0;
      
      progressBar.style.width = \`\${percentage}%\`;
      progressBar.textContent = \`\${percentage}%\`;
      
      totalAttachmentsSpan.textContent = \` (\${migratedCount}/\${attachments.length})\`;
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

/**
 * Função para registrar rotas do assistente de migração
 */
function registerAttachmentMigrationRoutes(app) {
  // Certificar-se de que o middleware isAuthenticated existe e está disponível
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ success: false, message: 'Acesso não autorizado' });
  };

  // Rota para a interface do assistente
  app.get('/attachment-migration', isAuthenticated, (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateAssistantHtml());
  });

  // Rota para buscar anexos em formato blob
  app.get('/api/attachment-migration/attachments', isAuthenticated, async (req, res) => {
    try {
      const attachments = await getBlobAttachments();
      res.json({ 
        success: true, 
        attachments,
        count: attachments.length
      });
    } catch (error) {
      console.error('Erro ao buscar anexos:', error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao buscar anexos: ${error.message}` 
      });
    }
  });

  // Rota para fazer upload e migrar um anexo
  app.post('/api/attachment-migration/upload', isAuthenticated, upload.single('attachmentFile'), async (req, res) => {
    let tempFilePath = null;
    
    try {
      if (!req.file) {
        throw new Error('Nenhum arquivo enviado');
      }
      
      tempFilePath = req.file.path;
      const requestId = req.body.requestId;
      
      if (!requestId) {
        throw new Error('ID da solicitação não informado');
      }
      
      // Buscar dados da solicitação
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
        throw new Error(`Solicitação ID ${requestId} não encontrada`);
      }
      
      const requestData = result.rows[0];
      
      // Garantir que o bucket existe
      await ensureStorageBucket();
      
      // Definir caminho de armazenamento
      const fileExtension = path.extname(req.file.originalname);
      const uniqueId = uuidv4();
      const destinationPath = `${requestData.base_id}/${requestData.id}/${uniqueId}${fileExtension}`;
      
      // Fazer upload para o Supabase
      const storageUrl = await uploadFileToSupabase(tempFilePath, destinationPath, req.file.mimetype);
      
      // Atualizar o registro da solicitação
      await updateBudgetRequestUrl(requestId, storageUrl);
      
      // Registrar metadados do anexo
      let attachmentRecord;
      try {
        attachmentRecord = await registerAttachmentMetadata(requestData, storageUrl, destinationPath);
      } catch (metadataError) {
        console.log('Aviso: Não foi possível registrar metadados do anexo:', metadataError.message);
        // Continuamos mesmo se esse passo falhar
      }
      
      res.json({
        success: true,
        message: 'Anexo migrado com sucesso',
        requestId: requestData.id,
        storageUrl,
        attachmentId: attachmentRecord?.id
      });
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      res.status(500).json({ 
        success: false, 
        message: `Erro ao processar upload: ${error.message}` 
      });
    } finally {
      // Limpar o arquivo temporário
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });

  console.log('Rotas do assistente de migração de anexos registradas com sucesso.');
}

module.exports = { registerAttachmentMigrationRoutes };