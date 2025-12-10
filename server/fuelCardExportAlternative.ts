import { Request, Response } from 'express';
import { pool } from './db';
import * as XLSX from 'xlsx';

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
        String(sol.placa || '').toUpperCase(),
        String(sol.nome_solicitante || '').toUpperCase(),
        String(sol.nome_motorista || '').toUpperCase(),
        valorFormatado,
        parseInt(sol.km || '0') || 0,
        (sol.tipo_cartao === 'numero' ? 'CARTÃO NUMERADO' : 
        sol.tipo_cartao === 'placa' ? 'CARTÃO POR PLACA' : 
        String(sol.tipo_cartao || 'PADRÃO')).toUpperCase(),
        String(sol.tipo_cartao === 'placa' ? sol.placa : sol.numero_cartao || '').toUpperCase(),
        String(sol.provedor_cartao || 'PADRÃO').toUpperCase(),
        String(sol.status || '').toUpperCase(),
        dataFormatada,
        String(sol.atendido_por || '').toUpperCase(),
        dataAtendimentoFormatada,
        String(sol.base || '').toUpperCase(),
        String(sol.observacoes || '').toUpperCase(),
        (sol.origem_tipo === 'line_hall' ? 'LINE HALL SHOPEE' : 
        sol.origem_tipo === 'base_system' ? 'SISTEMA DE BASES' : 'SISTEMA PRINCIPAL').toUpperCase()
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

/**
 * Exporta solicitações VELOE no formato "Carga Complementar Massiva"
 * - Filtra apenas solicitações com provedor_cartao = 'Veloe Go'
 * - Agrupa por placa, somando valores
 * - Bases repetidas são concatenadas no campo Observação
 */
export async function exportVeloeToExcel(req: Request, res: Response) {
  try {
    const { data_inicio, data_fim } = req.query;
    
    console.log('[EXPORT-VELOE] Iniciando exportação Veloe');
    console.log('[EXPORT-VELOE] Filtros:', { data_inicio, data_fim });

    // Construir query com filtros de data
    // Buscar apenas solicitações PENDENTES para realizar as recargas
    let whereClause = `WHERE LOWER(provedor_cartao) LIKE '%veloe%' AND LOWER(status) = 'pendente'`;
    const queryParams: any[] = [];
    
    if (data_inicio) {
      queryParams.push(data_inicio);
      whereClause += ` AND data_uso >= $${queryParams.length}`;
    }
    
    if (data_fim) {
      queryParams.push(data_fim);
      whereClause += ` AND data_uso <= $${queryParams.length}`;
    }

    // Query para buscar solicitações Veloe agrupadas por PLACA DO CARTÃO (numero_cartao)
    // numero_cartao = placa do cartão que vai receber o saldo
    const query = `
      SELECT 
        COALESCE(NULLIF(TRIM(numero_cartao), ''), placa) as placa_cartao,
        SUM(COALESCE(valor_solicitado, 0)) as valor_total,
        STRING_AGG(DISTINCT COALESCE(base, 'Base não identificada'), ', ') as bases
      FROM solicitacoes_fuel_card
      ${whereClause}
      GROUP BY COALESCE(NULLIF(TRIM(numero_cartao), ''), placa)
      ORDER BY placa_cartao
    `;
    
    console.log('[EXPORT-VELOE] Query:', query);
    console.log('[EXPORT-VELOE] Params:', queryParams);

    const result = await pool.query(query, queryParams);
    console.log('[EXPORT-VELOE] Total de placas agrupadas:', result.rows.length);

    // Criar planilha Excel no formato Veloe
    // Formato exato para importação no sistema Veloe (sem instruções, apenas cabeçalho e dados)
    
    // Cabeçalho da tabela de dados (linha 1)
    const header = ['CPF/Placa*', 'Tipo de alteração*', 'Valor para alteração*', 'Observação'];

    // Dados das solicitações - PLACA DO CARTÃO e TIPO como texto (UPPERCASE), VALOR como número formatado moeda
    const dataRows = result.rows.map((row: any) => [
      String(row.placa_cartao || '').toUpperCase(),     // Placa do cartão em caixa alta
      'ADICIONAR',                                       // Tipo de alteração (já em caixa alta)
      parseFloat(row.valor_total || 0),                  // Valor como número (Excel formatará como moeda)
      String(row.bases || '').toUpperCase()              // Observação em caixa alta
    ]);

    // Criar worksheet apenas com cabeçalho e dados (formato limpo para importação)
    const wsData = [
      header,
      ...dataRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Forçar colunas A e B como texto, C como número formatado moeda
    const totalRows = result.rows.length + 1; // +1 para cabeçalho
    for (let i = 2; i <= totalRows; i++) {
      // Coluna A (Placa) - texto
      const cellA = `A${i}`;
      if (ws[cellA]) {
        ws[cellA].t = 's';  // Tipo string/texto
      }
      // Coluna B (Tipo de alteração) - texto
      const cellB = `B${i}`;
      if (ws[cellB]) {
        ws[cellB].t = 's';  // Tipo string/texto
      }
      // Coluna C (Valor) - número com formato moeda
      const cellC = `C${i}`;
      if (ws[cellC]) {
        ws[cellC].t = 'n';  // Tipo numérico
        ws[cellC].z = '#.##0,00';  // Formato moeda brasileiro
      }
      // Coluna D (Observação) - texto
      const cellD = `D${i}`;
      if (ws[cellD]) {
        ws[cellD].t = 's';  // Tipo string/texto
      }
    }

    // Configurar largura das colunas
    ws['!cols'] = [
      { wch: 15 },  // CPF/Placa
      { wch: 20 },  // Tipo de alteração
      { wch: 25 },  // Valor para alteração
      { wch: 50 }   // Observação
    ];

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carga Veloe');

    // Gerar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Gerar nome do arquivo com data
    const dataHoje = new Date().toISOString().split('T')[0];
    const fileName = `veloe_carga_complementar_${dataHoje}.xlsx`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    console.log('[EXPORT-VELOE] Enviando arquivo:', fileName);
    res.send(buffer);

  } catch (error: any) {
    console.error('[EXPORT-VELOE] Erro ao exportar Veloe:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar arquivo Veloe',
      error: error.message
    });
  }
}

// Exportação Ticket - formato simples com PLACA e VALOR
export async function exportTicketCards(req: Request, res: Response) {
  try {
    console.log('[EXPORT-TICKET] Iniciando exportação Ticket');

    // Buscar TODAS as solicitações PENDENTES, agrupadas por PLACA DO CARTÃO (numero_cartao)
    // numero_cartao = placa do cartão que vai receber o saldo
    const query = `
      SELECT 
        COALESCE(NULLIF(TRIM(numero_cartao), ''), placa) as placa_cartao,
        SUM(COALESCE(valor_solicitado, 0)) as valor_total,
        STRING_AGG(DISTINCT COALESCE(base, 'Base não identificada'), ', ') as bases
      FROM solicitacoes_fuel_card
      WHERE LOWER(provedor_cartao) LIKE '%ticket%' 
        AND LOWER(status) = 'pendente'
      GROUP BY COALESCE(NULLIF(TRIM(numero_cartao), ''), placa)
      ORDER BY placa_cartao
    `;

    const result = await pool.query(query);
    
    console.log('[EXPORT-TICKET] Registros encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma solicitação Ticket pendente encontrada'
      });
    }

    // Cabeçalho com coluna de Bases
    const header = ['PLACA', 'VALOR', 'Bases'];

    // Dados das solicitações - PLACA DO CARTÃO como texto (UPPERCASE), VALOR como número, Bases como texto (UPPERCASE)
    const dataRows = result.rows.map((row: any) => [
      String(row.placa_cartao || '').toUpperCase(),    // Placa do cartão em caixa alta
      parseFloat(row.valor_total || 0),                 // Número sem formatação
      String(row.bases || '').toUpperCase()             // Bases em caixa alta
    ]);

    // Criar worksheet
    const wsData = [
      header,
      ...dataRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configurar formato das colunas
    ws['!cols'] = [
      { wch: 12 },  // PLACA
      { wch: 12 },  // VALOR
      { wch: 40 }   // Bases
    ];

    // Aplicar formato numérico para coluna VALOR (B)
    for (let i = 2; i <= result.rows.length + 1; i++) {
      const cellRef = `B${i}`;
      if (ws[cellRef]) {
        ws[cellRef].t = 'n';  // Tipo numérico
        ws[cellRef].z = '#,##0.00';  // Formato número com 2 decimais
      }
    }

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ticket');

    // Gerar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Gerar nome do arquivo com data
    const dataHoje = new Date().toISOString().split('T')[0];
    const fileName = `ticket_recarga_${dataHoje}.xlsx`;

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    console.log('[EXPORT-TICKET] Enviando arquivo:', fileName);
    res.send(buffer);

  } catch (error: any) {
    console.error('[EXPORT-TICKET] Erro ao exportar Ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar arquivo Ticket',
      error: error.message
    });
  }
}