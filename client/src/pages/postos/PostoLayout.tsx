import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, TruckIcon, Truck, History } from 'lucide-react';
import FormularioAbastecimento from './components/FormularioAbastecimento';
import FormularioRecebimento from './components/FormularioRecebimento';
import FormularioControlePatio from './components/FormularioControlePatio';
import { StatusTanqueWrapper } from './components/StatusTanqueWrapper';
import HistoricoMovimentacoes from './components/HistoricoMovimentacoes';
import HistoricoAbastecimentos from './components/HistoricoAbastecimentos';
import SupabaseConnectionTest from './components/SupabaseConnectionTest';

interface PostoLayoutProps {
  id: string;
  nomePosto: string;
}

export const PostoLayout: React.FC<PostoLayoutProps> = ({ id, nomePosto }) => {
  return (
    <div className="w-full p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Posto {nomePosto}</h1>
          <p className="text-muted-foreground">
            Gerencie as operações do posto de combustível {nomePosto}
          </p>
        </div>
        
        {/* Status dos Tanques e Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-1 md:col-span-3">
            <h2 className="text-xl font-semibold mb-3">Status dos Tanques</h2>
            <StatusTanqueWrapper postId={id} />
          </div>
          <div className="col-span-1">
            <h2 className="text-xl font-semibold mb-3">Diagnóstico</h2>
            <SupabaseConnectionTest />
          </div>
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
                  {/* Temporariamente desativado 
                <TabsTrigger value="recebimento" className="flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    <span>Recebimento</span>
                  </TabsTrigger>
                */}
                  <TabsTrigger value="patio" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Controle de Pátio</span>
                  </TabsTrigger>
                </TabsList>
                
                <FormularioAbastecimento postId={id} />
                {/* Temporariamente desativado 
                <FormularioRecebimento postId={id} />
                */}
                <FormularioControlePatio postId={id} />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HistoricoAbastecimentos postId={id} />
            <HistoricoMovimentacoes postId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostoLayout;