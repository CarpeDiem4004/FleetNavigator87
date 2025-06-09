/**
 * Sistema de validação completo para registros de abastecimento
 * Garante que todos os postos externos sempre enviem projeto_id e base_id
 */

import { Pool } from 'pg';
import { validateAndNormalizeFuelRegistration } from '../middleware/validate-fuel-registration.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Middleware de validação específico para postos externos
 */
export function validateExternalStationData(req, res, next) {
  const { body } = req;
  const postoId = req.params.posto || req.params.postId;
  
  console.log(`[External Station Validation] Validando dados para posto: ${postoId}`);
  console.log(`[External Station Validation] Dados recebidos:`, body);
  
  // Lista de postos externos que devem ter validação rigorosa
  const externalStations = [
    'abc_v2', 'alair_v2', 'campinas_v2', 'guarulhos_v2', 
    'osasco_v2', 'socorro_v2', 'sorocaba_v2'
  ];
  
  const isExternalStation = externalStations.some(station => 
    postoId && postoId.toLowerCase().includes(station)
  );
  
  if (isExternalStation) {
    // Validação rigorosa para postos externos
    if (!body.projeto_id || !body.base_id) {
      console.error(`[External Station Validation] ERRO - Posto externo ${postoId} sem projeto_id/base_id`);
      return res.status(400).json({
        success: false,
        error: 'Postos externos devem sempre incluir projeto_id e base_id',
        posto: postoId,
        missing_fields: {
          projeto_id: !body.projeto_id,
          base_id: !body.base_id
        },
        hint: 'Atualize o formulário do posto externo para incluir seletores de projeto e base'
      });
    }
    
    console.log(`[External Station Validation] ✓ Posto externo ${postoId} com projeto_id: ${body.projeto_id}, base_id: ${body.base_id}`);
  }
  
  next();
}

/**
 * Registrar rotas de validação para todos os postos
 */
export function registerValidationRoutes(app) {
  
  // Interceptar todas as rotas de abastecimento para aplicar validação
  const abastecimentoRoutes = [
    '/api/abastecimento/:posto',
    '/api/abastecimento-direto/:posto',
    '/api/posto/:posto/abastecimento',
    '/api/guarulhos-v2/abastecimento',
    '/api/osasco-v2/abastecimento'
  ];
  
  abastecimentoRoutes.forEach(route => {
    app.post(route, 
      validateExternalStationData,
      validateAndNormalizeFuelRegistration,
      (req, res, next) => {
        console.log(`[Validation System] ✓ Dados validados para rota: ${route}`);
        next();
      }
    );
  });
  
  // Endpoint para verificar status da validação
  app.get('/api/validation-status', async (req, res) => {
    try {
      const status = await getValidationStatus();
      res.json({
        success: true,
        validation_status: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Endpoint para forçar revalidação de dados históricos
  app.post('/api/force-data-validation', async (req, res) => {
    try {
      const result = await validateHistoricalData();
      res.json({
        success: true,
        validation_result: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Verificar status de integridade dos dados
 */
async function getValidationStatus() {
  const stations = [
    'abc_v2', 'alair_v2', 'campinas_v2', 
    'guarulhos_v2', 'osasco_v2', 'socorro_v2', 'sorocaba_v2'
  ];
  
  const status = {};
  
  for (const station of stations) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(projeto_id) as with_projeto_id,
          COUNT(base_id) as with_base_id,
          ROUND(COUNT(projeto_id)::numeric / COUNT(*) * 100, 2) as projeto_id_percentage,
          ROUND(COUNT(base_id)::numeric / COUNT(*) * 100, 2) as base_id_percentage
        FROM abastecimentos_posto_${station}
      `;
      
      const result = await pool.query(query);
      const row = result.rows[0];
      
      status[station] = {
        total_records: parseInt(row.total),
        with_projeto_id: parseInt(row.with_projeto_id),
        with_base_id: parseInt(row.with_base_id),
        projeto_id_coverage: parseFloat(row.projeto_id_percentage),
        base_id_coverage: parseFloat(row.base_id_percentage),
        status: row.projeto_id_percentage >= 95 ? 'GOOD' : 'NEEDS_ATTENTION'
      };
    } catch (error) {
      status[station] = {
        error: `Table not found or query failed: ${error.message}`,
        status: 'ERROR'
      };
    }
  }
  
  return status;
}

/**
 * Validar dados históricos e reportar problemas
 */
async function validateHistoricalData() {
  const issues = [];
  const stations = [
    'abc_v2', 'alair_v2', 'campinas_v2', 
    'guarulhos_v2', 'osasco_v2', 'socorro_v2', 'sorocaba_v2'
  ];
  
  for (const station of stations) {
    try {
      // Verificar registros sem projeto_id
      const missingProjectQuery = `
        SELECT COUNT(*) as count, MAX(created_at) as latest_missing
        FROM abastecimentos_posto_${station}
        WHERE projeto_id IS NULL
      `;
      
      const projectResult = await pool.query(missingProjectQuery);
      const missingProjects = parseInt(projectResult.rows[0].count);
      
      if (missingProjects > 0) {
        issues.push({
          station: station,
          issue: 'missing_projeto_id',
          count: missingProjects,
          latest_occurrence: projectResult.rows[0].latest_missing,
          severity: missingProjects > 10 ? 'HIGH' : 'MEDIUM'
        });
      }
      
      // Verificar registros sem base_id
      const missingBaseQuery = `
        SELECT COUNT(*) as count, MAX(created_at) as latest_missing
        FROM abastecimentos_posto_${station}
        WHERE base_id IS NULL
      `;
      
      const baseResult = await pool.query(missingBaseQuery);
      const missingBases = parseInt(baseResult.rows[0].count);
      
      if (missingBases > 0) {
        issues.push({
          station: station,
          issue: 'missing_base_id',
          count: missingBases,
          latest_occurrence: baseResult.rows[0].latest_missing,
          severity: missingBases > 10 ? 'HIGH' : 'MEDIUM'
        });
      }
      
    } catch (error) {
      issues.push({
        station: station,
        issue: 'validation_error',
        error: error.message,
        severity: 'ERROR'
      });
    }
  }
  
  return {
    total_issues: issues.length,
    issues: issues,
    validation_timestamp: new Date().toISOString()
  };
}

export default {
  registerValidationRoutes,
  validateExternalStationData,
  getValidationStatus,
  validateHistoricalData
};