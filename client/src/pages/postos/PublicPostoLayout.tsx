import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, TruckIcon, Truck, History } from 'lucide-react';
import { FormularioAbastecimentoMobileOptimized } from './components/FormularioAbastecimentoMobileOptimized';
import FormularioRecebimentoCombustivel from './components/FormularioRecebimentoCombustivel';
import FormularioControlePatio from './components/FormularioControlePatio';
import HistoricoMovimentacoes from './components/HistoricoMovimentacoes';
import HistoricoAbastecimentos from './components/HistoricoAbastecimentos';
import HistoricoAbastecimentosOptimized from './components/HistoricoAbastecimentosOptimized';
import HistoricoSupabaseView from './components/HistoricoSupabaseView';
import AdministrativoPostoView from './components/AdministrativoPostoView';
import HistoricoPostoNovo from './components/HistoricoPostoNovo';
import HistoricoAbastecimentosCompacto from './components/HistoricoAbastecimentosCompacto';
import HistoricoRecebimentos from './components/HistoricoRecebimentos';
import { useSafeDialog } from '@/hooks/use-safe-dialog';
import MobileOptimizedLayout from '@/components/mobile/MobileOptimizedLayout';
import { useMobileDetection } from '@/hooks/use-mobile-detection';

interface PublicPostoLayoutProps {
  id: string;
  nomePosto: string;
}

export const PublicPostoLayout: React.FC<PublicPostoLayoutProps> = ({ id, nomePosto }) => {
  // Use o hook useSafeDialog para evitar manipulações de DOM após desmontagem
  const dialogState = useSafeDialog(false);
  
  // Indicador de montagem do componente
  const isMountedRef = useRef(true);
  
  // Estado para controlar atualizações
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Detecção de dispositivo móvel
  const mobileDetection = useMobileDetection();

  // Identificação automática do posto ao carregar
  useEffect(() => {
    console.log(`[POSTO-IDENTIFICACAO] Posto detectado: ${id} (${nomePosto})`);
    console.log(`[POSTO-IDENTIFICACAO] URL atual: ${window.location.href}`);
    console.log(`[POSTO-IDENTIFICACAO] Usuario logado: ${localStorage.getItem('userName') || 'Não identificado'}`);
    
    // Salvar informações do posto no localStorage para uso posterior
    localStorage.setItem('currentPosto', id);
    localStorage.setItem('currentPostoName', nomePosto);
  }, [id, nomePosto]);
  
  // Efeito para controlar ciclo de vida do componente
  useEffect(() => {
    // Marcar componente como montado
    isMountedRef.current = true;
    
    return () => {
      // Marcar componente como desmontado na limpeza
      isMountedRef.current = false;
    };
  }, []);
  
  // Função para atualizar o histórico de abastecimentos com segurança
  const atualizarHistoricos = () => {
    console.log("[HISTORICO] Atualizando dados automaticamente");
    
    // Verificar se o componente ainda está montado antes de atualizar estado
    if (isMountedRef.current) {
      // Forçar múltiplas atualizações com diferentes intervalos para garantir que
      // o histórico seja atualizado após a conclusão da gravação no banco
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log("[HISTORICO] Primeira atualização imediata");
          setRefreshTrigger(prev => prev + 1);
        }
      }, 0);
      
      // Segunda atualização após 800ms
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log("[HISTORICO] Segunda atualização após 800ms");
          setRefreshTrigger(prev => prev + 1);
        }
      }, 800);
      
      // Terceira atualização após 2000ms
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log("[HISTORICO] Terceira atualização após 2000ms");
          setRefreshTrigger(prev => prev + 1);
        }
      }, 2000);
    }
  };
  
  // Usar layout mobile otimizado se for dispositivo móvel
  if (mobileDetection.isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Mobile Fixo */}
        <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-lg font-semibold truncate">Posto {nomePosto}</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">{navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Content Mobile */}
        <div className="p-4 pb-20 space-y-6">
          {/* Formulário de Abastecimento Mobile */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Fuel className="mr-2" size={20} />
                Abastecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <FormularioAbastecimentoMobileOptimized 
                postId={id} 
                onRegistroSucesso={atualizarHistoricos}
              />
            </CardContent>
          </Card>

          {/* Histórico Compacto Mobile */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <History className="mr-2" size={20} />
                Histórico Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <HistoricoAbastecimentosCompacto posto={id} refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Posto {nomePosto}</h1>
          <p className="text-muted-foreground">
            Gerencie as operações do posto de combustível {nomePosto}
          </p>
        </div>
        
        {/* Formulários */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Operações</h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Registrar Operações</CardTitle>
              <CardDescription>
                Selecione o tipo de operação que deseja registrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="abastecimento" className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                  <TabsTrigger value="abastecimento" className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span>Abastecimento</span>
                  </TabsTrigger>
                  <TabsTrigger value="recebimento" className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    <span>Entrada de Combustível</span>
                  </TabsTrigger>
                  <TabsTrigger value="patio" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Controle de Pátio</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="abastecimento">
                  <FormularioAbastecimentoMobileOptimized 
                    postId={id} 
                    onRegistroSucesso={atualizarHistoricos} 
                  />
                </TabsContent>
                <TabsContent value="recebimento">
                  <FormularioRecebimentoCombustivel 
                    postId={id} 
                    onRegistroSucesso={atualizarHistoricos}
                  />
                </TabsContent>
                <TabsContent value="patio">
                  <FormularioControlePatio 
                    postId={id} 
                    onRegistroSucesso={atualizarHistoricos} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Históricos */}
        <div id="historicos-section">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <History className="h-5 w-5" />
            Históricos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Usar o componente simplificado para todos os postos */}
            <div className="lg:col-span-2">
              <HistoricoAbastecimentosCompacto
                posto={id.toLowerCase().replace(/ /g, '_')}
                refreshTrigger={refreshTrigger}
              />
            </div>
            <div className="lg:col-span-1">
              <HistoricoRecebimentos 
                postId={id.toLowerCase().replace(/ /g, '_')} 
              />
            </div>
            <div className="lg:col-span-3">
              <HistoricoMovimentacoes 
                postId={id} 
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPostoLayout;