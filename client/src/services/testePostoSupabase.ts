/**
 * Arquivo para testar a comunicação com o serviço de postos do Supabase
 */

import { postoSupabaseService } from './PostoSupabaseService';

// Função para testar o serviço de posto
async function testarServicoPosto() {
  try {
    // Teste para o posto Alair
    console.log("Testando serviço para Posto Alair:");
    
    // Verificar se a tabela existe
    const tabelaExiste = await postoSupabaseService.verificarTabelaPosto('alair');
    console.log(`Tabela para Posto Alair existe: ${tabelaExiste}`);
    
    // Obter histórico consolidado
    const historico = await postoSupabaseService.obterHistorico('alair');
    console.log(`Histórico consolidado obtido: ${historico.success}`);
    console.log(`Quantidade de registros: ${historico.data.length}`);
    
    // Exibir primeiro registro se disponível
    if (historico.data.length > 0) {
      console.log("Primeiro registro do histórico:");
      console.log(historico.data[0]);
    }
    
    // Testar outras funções se necessário
    // const estatisticas = await postoSupabaseService.obterEstatisticasMensais('alair');
    // console.log("Estatísticas mensais:", estatisticas);
    
    console.log("Testes concluídos com sucesso!");
  } catch (error) {
    console.error("Erro ao testar serviço:", error);
  }
}

// Executar os testes
testarServicoPosto();