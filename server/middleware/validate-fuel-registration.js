/**
 * Middleware para validar registros de abastecimento
 * Garante que projeto_id e base_id sejam sempre fornecidos
 */

/**
 * Valida se os campos obrigatórios estão presentes
 */
export function validateFuelRegistration(req, res, next) {
  const { body } = req;
  
  // Campos obrigatórios
  const requiredFields = [
    'placa',
    'km',
    'tipo_combustivel',
    'quantidade',
    'valor_litro',
    'motorista',
    'operador'
  ];
  
  // Validar campos básicos obrigatórios
  for (const field of requiredFields) {
    if (!body[field] && body[field] !== 0) {
      return res.status(400).json({
        success: false,
        error: `Campo obrigatório ausente: ${field}`,
        field: field
      });
    }
  }
  
  // Validar projeto_id (obrigatório e deve ser numérico)
  if (!body.projeto_id) {
    return res.status(400).json({
      success: false,
      error: 'Campo projeto_id é obrigatório para garantir rastreamento correto',
      field: 'projeto_id',
      hint: 'Todos os registros devem estar associados a um projeto válido'
    });
  }
  
  const projetoId = parseInt(body.projeto_id);
  if (isNaN(projetoId) || projetoId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'projeto_id deve ser um número inteiro válido maior que zero',
      field: 'projeto_id',
      value: body.projeto_id
    });
  }
  
  // Validar base_id (obrigatório e deve ser numérico)
  if (!body.base_id) {
    return res.status(400).json({
      success: false,
      error: 'Campo base_id é obrigatório para garantir rastreamento correto',
      field: 'base_id',
      hint: 'Todos os registros devem estar associados a uma base válida'
    });
  }
  
  const baseId = parseInt(body.base_id);
  if (isNaN(baseId) || baseId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'base_id deve ser um número inteiro válido maior que zero',
      field: 'base_id',
      value: body.base_id
    });
  }
  
  // Validar tipos de dados numéricos
  const numericFields = ['km', 'quantidade', 'valor_litro'];
  for (const field of numericFields) {
    const value = parseFloat(body[field]);
    if (isNaN(value) || value < 0) {
      return res.status(400).json({
        success: false,
        error: `Campo ${field} deve ser um número válido maior ou igual a zero`,
        field: field,
        value: body[field]
      });
    }
  }
  
  // Validar placa (formato básico)
  if (typeof body.placa !== 'string' || body.placa.length < 7) {
    return res.status(400).json({
      success: false,
      error: 'Placa deve ter pelo menos 7 caracteres',
      field: 'placa',
      value: body.placa
    });
  }
  
  // Validar tipo de combustível
  const tiposValidos = ['Diesel', 'Arla', 'Gasolina', 'Álcool'];
  if (!tiposValidos.includes(body.tipo_combustivel)) {
    return res.status(400).json({
      success: false,
      error: `Tipo de combustível inválido. Valores aceitos: ${tiposValidos.join(', ')}`,
      field: 'tipo_combustivel',
      value: body.tipo_combustivel
    });
  }
  
  console.log(`[Validation] Registro validado com sucesso - Projeto ID: ${projetoId}, Base ID: ${baseId}`);
  
  // Prosseguir para o próximo middleware
  next();
}

/**
 * Normaliza dados do abastecimento para garantir consistência
 */
export function normalizeFuelData(req, res, next) {
  const { body } = req;
  
  // Normalizar placa (maiúsculas, sem espaços)
  if (body.placa) {
    body.placa = body.placa.toString().toUpperCase().trim();
  }
  
  // Garantir que projeto_id e base_id sejam números
  if (body.projeto_id) {
    body.projeto_id = parseInt(body.projeto_id);
  }
  
  if (body.base_id) {
    body.base_id = parseInt(body.base_id);
  }
  
  // Calcular valor_total se não fornecido
  if (!body.valor_total && body.quantidade && body.valor_litro) {
    body.valor_total = parseFloat(body.quantidade) * parseFloat(body.valor_litro);
  }
  
  // Garantir que valor_total seja numérico
  if (body.valor_total) {
    body.valor_total = parseFloat(body.valor_total);
  }
  
  // Adicionar timestamp com fuso horário do Brasil se não fornecido
  if (!body.created_at) {
    // Criar data atual no fuso horário do Brasil (UTC-3)
    const brasiliaTime = new Date();
    brasiliaTime.setHours(brasiliaTime.getHours() - 3);
    body.created_at = brasiliaTime.toISOString();
    
    console.log(`[Timestamp] Horário Brasil aplicado: ${body.created_at}`);
  }
  
  console.log(`[Normalization] Dados normalizados - Placa: ${body.placa}, Valor Total: ${body.valor_total}`);
  
  next();
}

/**
 * Middleware combinado para validação e normalização
 */
export function validateAndNormalizeFuelRegistration(req, res, next) {
  validateFuelRegistration(req, res, (err) => {
    if (err) return next(err);
    normalizeFuelData(req, res, next);
  });
}