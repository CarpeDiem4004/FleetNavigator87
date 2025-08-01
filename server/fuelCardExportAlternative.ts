import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Exporta solicitações de cartão de combustível em formato CSV
 * Esta é uma alternativa mais simples e confiável ao Excel
 */
export async function exportFuelCardSolicitationsToCSV(req: Request, res: Response) {
  try {
    console.log('[EXPORT-CSV] Iniciando exportação de solicitações de cartão de combustível');
    
    // Buscar dados de cada tabela separadamente e depois unir
    const allSolicitations = [];
    
    // 1. Tabela tradicional (solicitacoes_fuel_card)
    try {
      const traditionalQuery = `
        SELECT 
          id::text as id,
          placa,
          motorista as nome_motorista,
          COALESCE(motorista, '') as nome_solicitante,
          COALESCE(valor_solicitado::text, '0') as valor_solicitado,
          COALESCE(km, 0) as km,
          tipo_cartao,
          numero_cartao,
          provedor_cartao,
          status,
          data_solicitacao,
          atendido_por,
          data_atendimento,
          observacoes,
          'sistema_principal' as origem_tipo,
          COALESCE(base, 'Base Principal') as base
        FROM solicitacoes_fuel_card
        ORDER BY data_solicitacao DESC
      `;
      
      const traditionalResult = await pool.query(traditionalQuery);
      allSolicitations.push(...traditionalResult.rows);
      console.log('[EXPORT-CSV] Tabela tradicional:', traditionalResult.rows.length, 'registros');
    } catch (err) {
      console.log('[EXPORT-CSV] Tabela tradicional não encontrada ou erro:', err);
    }
    
    // 2. Tabela Line Hall (linehall_fuel_card_requests)
    try {
      const lineHallQuery = `
        SELECT 
          id::text as id,
          veiculo_placa as placa,
          COALESCE(motorista_nome, '') as nome_motorista,
          COALESCE(motorista_nome, '') as nome_solicitante,
          COALESCE(valor_calculado::text, '0') as valor_solicitado,
          COALESCE(km_total, 0) as km,
          'vinculado' as tipo_cartao,
          veiculo_placa as numero_cartao,
          'Alelo' as provedor_cartao,
          status,
          created_at as data_solicitacao,
          '' as atendido_por,
          updated_at as data_atendimento,
          '' as observacoes,
          'line_hall' as origem_tipo,
          'Line Hall Shopee' as base
        FROM linehall_fuel_card_requests
        ORDER BY created_at DESC
      `;
      
      const lineHallResult = await pool.query(lineHallQuery);
      allSolicitations.push(...lineHallResult.rows);
      console.log('[EXPORT-CSV] Tabela Line Hall:', lineHallResult.rows.length, 'registros');
    } catch (err) {
      console.log('[EXPORT-CSV] Tabela Line Hall não encontrada ou erro:', err);
    }
    
    // 3. Tabela base system (fuel_card_requests)
    try {
      const baseSystemQuery = `
        SELECT 
          fcr.id::text as id,
          fcr.plate as placa,
          COALESCE(fcr.driver_name, '') as nome_motorista,
          COALESCE(fcr.requested_by, '') as nome_solicitante,
          COALESCE(fcr.amount::text, '0') as valor_solicitado,
          COALESCE(fcr.odometer, 0) as km,
          fcr.card_type as tipo_cartao,
          fcr.card_number as numero_cartao,
          fcr.provider as provedor_cartao,
          fcr.status,
          fcr.created_at as data_solicitacao,
          fcr.approved_by as atendido_por,
          fcr.approved_at as data_atendimento,
          fcr.notes as observacoes,
          'base_system' as origem_tipo,
          COALESCE(b.name, 'Base não identificada') as base
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        ORDER BY fcr.created_at DESC
      `;
      
      const baseSystemResult = await pool.query(baseSystemQuery);
      allSolicitations.push(...baseSystemResult.rows);
      console.log('[EXPORT-CSV] Tabela base system:', baseSystemResult.rows.length, 'registros');
    } catch (err) {
      console.log('[EXPORT-CSV] Tabela base system não encontrada ou erro:', err);
    }
    
    // Ordenar por data
    const solicitations = allSolicitations.sort((a, b) => {
      const dateA = new Date(a.data_solicitacao);
      const dateB = new Date(b.data_solicitacao);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('[EXPORT-CSV] Total de solicitações para exportar:', solicitations.length);

    // Preparar dados para CSV
    const csvData = [];
    
    // Cabeçalho
    csvData.push([
      'ID',
      'Placa',
      'Nome do Solicitante',
      'Motorista do Veiculo',
      'Valor Solicitado',
      'KM',
      'Tipo Cartao',
      'Numero Cartao',
      'Provedor',
      'Status',
      'Data Solicitacao',
      'Atendido Por',
      'Data Atendimento',
      'Base',
      'Observacoes',
      'Origem'
    ]);

    // Dados
    solicitations.forEach((sol: any) => {
      const valorFormatado = parseFloat(sol.valor_solicitado) || 0;
      const dataFormatada = sol.data_solicitacao ? new Date(sol.data_solicitacao).toLocaleDateString('pt-BR') : '';
      const dataAtendimentoFormatada = sol.data_atendimento ? new Date(sol.data_atendimento).toLocaleDateString('pt-BR') : '';
      
      csvData.push([
        String(sol.id || ''),
        String(sol.placa || ''),
        String(sol.nome_solicitante || ''),
        String(sol.nome_motorista || ''),
        valorFormatado,
        parseInt(sol.km || '0') || 0,
        sol.tipo_cartao === 'numero' ? 'Cartão Numerado' : 
        sol.tipo_cartao === 'placa' ? 'Cartão por Placa' : 
        String(sol.tipo_cartao || 'Padrão'),
        String(sol.tipo_cartao === 'placa' ? sol.placa : sol.numero_cartao || ''),
        String(sol.provedor_cartao || 'Padrão'),
        String(sol.status || ''),
        dataFormatada,
        String(sol.atendido_por || ''),
        dataAtendimentoFormatada,
        String(sol.base || ''),
        String(sol.observacoes || ''),
        sol.origem_tipo === 'line_hall' ? 'Line Hall Shopee' : 
        sol.origem_tipo === 'base_system' ? 'Base System' : 'Sistema Principal'
      ]);
    });

    // Converter para CSV
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
    ).join('\n');

    // Configurar headers para download
    const fileName = `solicitacoes-cartao-combustivel-${new Date().toISOString().split('T')[0]}.csv`;
    
    console.log('[EXPORT-CSV] Enviando arquivo CSV:', fileName);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Enviar arquivo
    res.send('\ufeff' + csvContent); // BOM para UTF-8

  } catch (error: any) {
    console.error('[EXPORT-CSV] Erro ao exportar CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar arquivo CSV',
      error: error.message
    });
  }
}