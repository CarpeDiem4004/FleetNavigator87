import express from 'express';
import { pool } from '../db';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Rota para sincronizar serviços de guincho entre todas as tabelas do sistema
router.post('/sincronizar-servicos-guincho', isAuthenticated, async (req, res) => {
  try {
    console.log("[Sincronização] Iniciando sincronização global de serviços de guincho...");
    
    // 1. Primeiro, sincronizar towing_partner_services com servicos_guincho
    const syncToServicosGuinchoQuery = `
      INSERT INTO servicos_guincho (
        id, parceiro_id, placa_veiculo, endereco_origem, endereco_destino, 
        quilometragem, valor, data_servico, data_lancamento, status, 
        observacoes, usuario_aprovacao, data_aprovacao
      )
      SELECT 
        tps.id, tps.partner_id, tps.plate, tps.origin, tps.destination,
        COALESCE(tps.km_traveled, 0), COALESCE(tps.cost, 0), tps.service_date, 
        COALESCE(tps.created_at, NOW()), COALESCE(tps.status, 'pending'),
        tps.notes, tps.approved_by, tps.approved_at
      FROM towing_partner_services tps
      LEFT JOIN servicos_guincho sg ON tps.id = sg.id
      WHERE sg.id IS NULL
      ON CONFLICT (id) DO UPDATE SET
        parceiro_id = EXCLUDED.parceiro_id,
        placa_veiculo = EXCLUDED.placa_veiculo,
        endereco_origem = EXCLUDED.endereco_origem,
        endereco_destino = EXCLUDED.endereco_destino,
        quilometragem = EXCLUDED.quilometragem,
        valor = EXCLUDED.valor,
        data_servico = EXCLUDED.data_servico,
        status = EXCLUDED.status,
        observacoes = EXCLUDED.observacoes,
        usuario_aprovacao = EXCLUDED.usuario_aprovacao,
        data_aprovacao = EXCLUDED.data_aprovacao
    `;
    
    const servicosGuinchoResult = await pool.query(syncToServicosGuinchoQuery);
    console.log(`[Sincronização] Serviços atualizados em servicos_guincho: ${servicosGuinchoResult.rowCount || 0}`);
    
    // 2. Em seguida, sincronizar de volta para towing_partner_services qualquer dado novo
    const syncBackToPartnerServicesQuery = `
      INSERT INTO towing_partner_services (
        id, partner_id, plate, origin, destination, 
        cost, service_date, notes, status, 
        approved_by, approved_at, created_at
      )
      SELECT 
        sg.id, sg.parceiro_id, sg.placa_veiculo, sg.endereco_origem, sg.endereco_destino,
        sg.valor, sg.data_servico, sg.observacoes, sg.status,
        sg.usuario_aprovacao, sg.data_aprovacao, COALESCE(sg.data_lancamento, NOW())
      FROM servicos_guincho sg
      LEFT JOIN towing_partner_services tps ON sg.id = tps.id
      WHERE tps.id IS NULL
      ON CONFLICT (id) DO UPDATE SET
        partner_id = EXCLUDED.partner_id,
        plate = EXCLUDED.plate,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        cost = EXCLUDED.cost,
        service_date = EXCLUDED.service_date,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        approved_by = EXCLUDED.approved_by,
        approved_at = EXCLUDED.approved_at
    `;
    
    const towingServicesResult = await pool.query(syncBackToPartnerServicesQuery);
    console.log(`[Sincronização] Serviços sincronizados de volta para towing_partner_services: ${towingServicesResult.rowCount || 0}`);
    
    // 3. Atualizar a view vw_servicos_guincho (apenas se necessário)
    // Esta etapa só é necessária se a view não for refreshed automaticamente pelo sistema
    try {
      const refreshViewQuery = `
        REFRESH MATERIALIZED VIEW IF EXISTS vw_servicos_guincho;
      `;
      await pool.query(refreshViewQuery);
      console.log("[Sincronização] View vw_servicos_guincho atualizada com sucesso");
    } catch (viewError) {
      console.log("[Sincronização] Nota: vw_servicos_guincho não é uma materialized view ou não existe");
      // Não interromper o processo se a view não for materializada
    }
    
    // 4. Verificar quantos serviços estão em cada tabela após a sincronização
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM towing_partner_services) AS partner_services_count,
        (SELECT COUNT(*) FROM servicos_guincho) AS servicos_count,
        (SELECT COUNT(*) FROM vw_servicos_guincho) AS view_count
    `);
    
    const totals = counts.rows[0];
    console.log("[Sincronização] Contagens após sincronização:", totals);
    
    res.status(200).json({
      success: true,
      message: "Sincronização de serviços realizada com sucesso",
      statistics: {
        totalServicosSincronizados: (servicosGuinchoResult.rowCount || 0) + (towingServicesResult.rowCount || 0),
        servicosGuinchoSincronizados: servicosGuinchoResult.rowCount || 0,
        partnerServicesSincronizados: towingServicesResult.rowCount || 0,
        contagens: totals
      }
    });
  } catch (error) {
    console.error("[Sincronização] Erro ao sincronizar serviços:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao sincronizar serviços",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// Rota para corrigir serviços que estão em uma tabela mas não na outra
router.post('/corrigir-visualizacao-servicos', isAuthenticated, async (req, res) => {
  try {
    console.log("[Correção] Iniciando correção de visualização de serviços...");
    
    // Primeiro, verifica se a view vw_servicos_guincho existe
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_catalog.pg_views
        WHERE schemaname = 'public' AND viewname = 'vw_servicos_guincho'
      ) AS view_exists;
    `);
    
    const viewExists = viewCheck.rows[0].view_exists;
    
    if (!viewExists) {
      // Se a view não existir, cria uma nova com os dados consolidados
      const createViewQuery = `
        CREATE OR REPLACE VIEW vw_servicos_guincho AS
        SELECT 
          COALESCE(t.id, s.id) as id,
          COALESCE(t.partner_id, s.parceiro_id) as partner_id,
          p.name as parceiro_nome,
          p.company_name as parceiro_empresa,
          COALESCE(p.city, 'São Paulo') as parceiro_cidade,
          COALESCE(p.status, 'ativo'::text) as parceiro_status,
          COALESCE(t.vehicle_plate, s.placa) as placa,
          COALESCE(t.origin_location, s.origem) as pickup_location,
          COALESCE(t.destination_location, s.destino) as delivery_location,
          COALESCE(t.service_type, s.tipo_servico) as tipo_servico,
          COALESCE(t.service_date, s.data_lancamento) as data_servico,
          COALESCE(t.cost, s.valor) as valor,
          COALESCE(t.distance, s.km_percorrido) as km_reboque,
          COALESCE(t.notes, s.observacoes) as observacoes,
          COALESCE(t.status, s.status) as status,
          COALESCE(t.created_at, s.created_at) as created_at,
          COALESCE(t.priority, s.prioridade) as priority
        FROM towing_partners p
        LEFT JOIN towing_service_notes t ON p.id = t.partner_id
        LEFT JOIN servicos_guincho s ON p.id = s.parceiro_id
        WHERE t.id IS NOT NULL OR s.id IS NOT NULL;
      `;
      
      await pool.query(createViewQuery);
      console.log("[Correção] View vw_servicos_guincho criada com sucesso");
    }
    
    // Executa a sincronização para garantir que todos os dados estejam atualizados
    await pool.query(`
      INSERT INTO servicos_guincho (
        id, parceiro_id, placa, origem, destino, 
        tipo_servico, data_lancamento, valor, km_percorrido, 
        observacoes, status, prioridade
      )
      SELECT 
        tsn.id, tsn.partner_id, tsn.plate, tsn.pickup_location, tsn.delivery_location,
        tsn.service_description, tsn.service_date, tsn.cost, tsn.mileage,
        tsn.notes, tsn.status, tsn.priority
      FROM towing_service_notes tsn
      LEFT JOIN servicos_guincho sg ON tsn.id = sg.id
      WHERE sg.id IS NULL
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Verificar total de serviços disponíveis
    const countQuery = `
      SELECT 
        (SELECT COUNT(*) FROM towing_service_notes) AS notes_count,
        (SELECT COUNT(*) FROM vw_servicos_guincho) AS view_count
    `;
    
    const countResult = await pool.query(countQuery);
    const counts = countResult.rows[0];
    
    res.status(200).json({
      success: true,
      message: "Visualização de serviços corrigida com sucesso",
      data: {
        totalServicosNotas: counts.notes_count,
        totalServicosView: counts.view_count,
        viewExistente: viewExists
      }
    });
  } catch (error) {
    console.error("[Correção] Erro ao corrigir visualização de serviços:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao corrigir visualização de serviços",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;