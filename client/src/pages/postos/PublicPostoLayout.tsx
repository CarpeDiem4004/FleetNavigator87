import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, TruckIcon, Truck, History } from 'lucide-react';
import { FormularioAbastecimentoMobileFixed } from './components/FormularioAbastecimentoMobileFixed';
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
            <CardContent className="p-3 md:p-6">
              <Tabs defaultValue="abastecimento" className="w-full">
                {/* Versão Mobile - Lista Vertical */}
                <div className="block md:hidden">
                  <TabsList className="flex flex-col w-full gap-3 h-auto p-3 bg-gray-50/50 rounded-xl">
                    <TabsTrigger 
                      value="abastecimento" 
                      className="flex items-center justify-start gap-4 w-full h-16 px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:shadow-md data-[state=active]:bg-blue-100 data-[state=active]:border-blue-500 data-[state=active]:text-blue-800 data-[state=active]:shadow-lg transition-all duration-300 touch-manipulation"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg data-[state=active]:bg-blue-200">
                        <Fuel className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-semibold text-base">Abastecimento</span>
                        <span className="text-sm text-gray-600">Registrar combustível usado</span>
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="recebimento" 
                      className="flex items-center justify-start gap-4 w-full h-16 px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 hover:shadow-md data-[state=active]:bg-green-100 data-[state=active]:border-green-500 data-[state=active]:text-green-800 data-[state=active]:shadow-lg transition-all duration-300 touch-manipulation"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg data-[state=active]:bg-green-200">
                        <TruckIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-semibold text-base">Entrada de Combustível</span>
                        <span className="text-sm text-gray-600">Registrar recebimento de tanque</span>
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="patio" 
                      className="flex items-center justify-start gap-4 w-full h-16 px-4 py-3 text-left bg-white border-2 border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 hover:shadow-md data-[state=active]:bg-orange-100 data-[state=active]:border-orange-500 data-[state=active]:text-orange-800 data-[state=active]:shadow-lg transition-all duration-300 touch-manipulation"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg data-[state=active]:bg-orange-200">
                        <Truck className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-semibold text-base">Controle de Pátio</span>
                        <span className="text-sm text-gray-600">Movimentação de veículos</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Versão Desktop - Grid Horizontal */}
                <div className="hidden md:block">
                  <TabsList className="grid w-full grid-cols-3 gap-3 h-auto p-2 bg-gray-50 rounded-lg">
                    <TabsTrigger 
                      value="abastecimento" 
                      className="flex items-center justify-center gap-3 h-14 px-4 text-center bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 data-[state=active]:bg-blue-100 data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 transition-all duration-200"
                    >
                      <Fuel className="h-5 w-5" />
                      <span className="font-medium">Abastecimento</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="recebimento" 
                      className="flex items-center justify-center gap-3 h-14 px-4 text-center bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 data-[state=active]:bg-green-100 data-[state=active]:border-green-500 data-[state=active]:text-green-700 transition-all duration-200"
                    >
                      <TruckIcon className="h-5 w-5" />
                      <span className="font-medium">Entrada de Combustível</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="patio" 
                      className="flex items-center justify-center gap-3 h-14 px-4 text-center bg-white border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 data-[state=active]:bg-orange-100 data-[state=active]:border-orange-500 data-[state=active]:text-orange-700 transition-all duration-200"
                    >
                      <Truck className="h-5 w-5" />
                      <span className="font-medium">Controle de Pátio</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="abastecimento">
                  <FormularioAbastecimentoMobileFixed 
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