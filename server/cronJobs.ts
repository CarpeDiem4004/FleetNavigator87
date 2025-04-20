import { createClient } from '@supabase/supabase-js'
import cron from 'node-cron'
import { pool } from './db'

// Conectar ao Supabase
const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Inicia os jobs cron para tarefas agendadas
 */
function initCronJobs() {
  console.log('Iniciando jobs cron para o sistema...')

  // Cron: Executa todo dia às 03h da manhã
  cron.schedule('0 3 * * *', async () => {
    console.log('Atualizando painel principal...')

    try {
      // Exemplo: contar veículos parados
      const { count: veiculosParados } = await supabase
        .from('veiculos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'parado')

      const { count: manutencoesPendentes } = await supabase
        .from('manutencao')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')

      // Obter LineHall parados
      const { count: linehallParados } = await supabase
        .from('linha_corredor')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'parado')

      // Calcular dias parados totais
      const { data: veiculosParadosData } = await supabase
        .from('veiculos')
        .select('updated_at')
        .eq('status', 'parado')

      // Calcular dias totais parados somando a diferença entre hoje e a data de atualização
      const hoje = new Date()
      let diasParadosTotal = 0
      
      if (veiculosParadosData) {
        diasParadosTotal = veiculosParadosData.reduce((sum, veiculo) => {
          if (veiculo.updated_at) {
            const dataAtualizacao = new Date(veiculo.updated_at)
            const diasParado = Math.floor((hoje - dataAtualizacao) / (1000 * 60 * 60 * 24))
            return sum + diasParado
          }
          return sum
        }, 0)
      }

      // Exemplo com diesel
      const { data: abastecimentos } = await supabase
        .from('abastecimentos')
        .select('quantidade_litros, valor_total')
        .gte('data', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

      const litrosTotais = abastecimentos?.reduce((sum, ab) => sum + (ab.quantidade_litros || 0), 0)
      const valorTotal = abastecimentos?.reduce((sum, ab) => sum + (ab.valor_total || 0), 0)

      // Buscar dados de viagens
      const { data: viagens } = await supabase
        .from('linha_corredor')
        .select('status')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

      const viagensConcluidas = viagens?.filter(v => v.status === 'finalizada').length || 0
      const viagensNoShow = viagens?.filter(v => v.status === 'no_show').length || 0
      const viagensCanceladas = viagens?.filter(v => v.status === 'cancelada').length || 0

      // Buscar dados de segurança
      const { data: sinistros } = await supabase
        .from('sinistros')
        .select('tipo')
        .gte('data_ocorrencia', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

      const qtdSinistros = sinistros?.filter(s => s.tipo === 'acidente').length || 0
      const qtdRoubos = sinistros?.filter(s => s.tipo === 'roubo').length || 0
      const incidentesSeguranca = sinistros?.filter(s => s.tipo === 'seguranca_trabalho').length || 0

      // Calcular média do tempo de manutenção
      const { data: manutencoesFinalizadas } = await supabase
        .from('manutencao')
        .select('entry_date, actual_exit_date')
        .eq('status', 'concluida')
        .gte('actual_exit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

      let tempoMedioManutencao = "0 dias"
      if (manutencoesFinalizadas && manutencoesFinalizadas.length > 0) {
        const totalDias = manutencoesFinalizadas.reduce((sum, manutencao) => {
          if (manutencao.entry_date && manutencao.actual_exit_date) {
            const entrada = new Date(manutencao.entry_date)
            const saida = new Date(manutencao.actual_exit_date)
            const dias = Math.floor((saida - entrada) / (1000 * 60 * 60 * 24))
            return sum + dias
          }
          return sum
        }, 0)
        
        const media = totalDias / manutencoesFinalizadas.length
        tempoMedioManutencao = `${media.toFixed(1)} dias`
      }

      // Buscar dados de pneus
      const { data: pneus } = await supabase
        .from('pneus')
        .select('id, status')
        .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

      const movimentacoesPneus = pneus?.length || 0
      const pneusSubstituidos = pneus?.filter(p => p.status === 'substituido').length || 0

      // Insere na tabela painel_principal usando consulta SQL direta
      try {
        const dataRef = new Date().toISOString().slice(0, 10);
        const result = await pool.query(
          `INSERT INTO painel_principal (
            data_referencia, veiculos_parados, dias_parados_total, 
            manutencoes_pendentes, tempo_medio_manutencao, linehall_parados,
            viagens_concluidas, viagens_no_show, viagens_canceladas_cliente,
            litros_diesel_total, gasto_total_combustivel, qtd_sinistros,
            qtd_roubos, incidentes_seguranca_trabalho, movimentacoes_pneus,
            pneus_substituidos
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id`,
          [
            dataRef,
            veiculosParados || 0,
            diasParadosTotal || 0,
            manutencoesPendentes || 0,
            tempoMedioManutencao,
            linehallParados || 0,
            viagensConcluidas || 0,
            viagensNoShow || 0,
            viagensCanceladas || 0,
            litrosTotais || 0,
            valorTotal || 0,
            qtdSinistros || 0,
            qtdRoubos || 0,
            incidentesSeguranca || 0,
            movimentacoesPneus || 0,
            pneusSubstituidos || 0
          ]
        );
        
        console.log('Painel principal atualizado com sucesso ✅', result.rows[0]);
      } catch (dbError) {
        console.error('Erro ao atualizar painel:', dbError);
      }
    } catch (error) {
      console.error('Erro na execução do job de atualização do painel:', error)
    }
  })

  console.log('Jobs cron iniciados com sucesso')
}

export { initCronJobs }