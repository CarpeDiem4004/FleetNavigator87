import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatusTanque from './StatusTanque';
import { Database } from 'lucide-react';

interface StatusTanquePostoProps {
  postId: string;
}

// Dados mock para visualização - Seriam substituídos por dados reais da API/banco de dados
const dadosTanques = {
  osasco: {
    diesel: { capacidade: 20000, atual: 12000, ultimoRecebimento: '2025-04-15T10:30:00Z' },
    arla: { capacidade: 5000, atual: 1800, ultimoRecebimento: '2025-04-10T14:45:00Z' }
  },
  guarulhos: {
    diesel: { capacidade: 25000, atual: 18500, ultimoRecebimento: '2025-04-14T09:15:00Z' },
    arla: { capacidade: 6000, atual: 4200, ultimoRecebimento: '2025-04-12T11:30:00Z' }
  },
  saopaulo: {
    diesel: { capacidade: 30000, atual: 9000, ultimoRecebimento: '2025-04-16T08:45:00Z' },
    arla: { capacidade: 7000, atual: 5100, ultimoRecebimento: '2025-04-13T15:20:00Z' }
  },
  campinas: {
    diesel: { capacidade: 22000, atual: 15400, ultimoRecebimento: '2025-04-13T10:00:00Z' },
    arla: { capacidade: 5500, atual: 2900, ultimoRecebimento: '2025-04-11T13:10:00Z' }
  },
  abc: {
    diesel: { capacidade: 18000, atual: 7200, ultimoRecebimento: '2025-04-15T16:30:00Z' },
    arla: { capacidade: 4500, atual: 3200, ultimoRecebimento: '2025-04-14T09:45:00Z' }
  },
  socorro: {
    diesel: { capacidade: 15000, atual: 10500, ultimoRecebimento: '2025-04-12T14:20:00Z' },
    arla: { capacidade: 4000, atual: 1500, ultimoRecebimento: '2025-04-10T11:30:00Z' }
  },
  sorocaba: {
    diesel: { capacidade: 20000, atual: 11800, ultimoRecebimento: '2025-04-14T12:15:00Z' },
    arla: { capacidade: 5000, atual: 3800, ultimoRecebimento: '2025-04-13T10:45:00Z' }
  }
};

const StatusTanquePosto: React.FC<StatusTanquePostoProps> = ({ postId }) => {
  // Na implementação real, aqui teria uma chamada de API ou hook para buscar os dados reais
  // const { data, isLoading } = useQuery(['/api/tanques', postId], ...);
  
  // Utiliza os dados mock para visualização
  const tanques = dadosTanques[postId as keyof typeof dadosTanques] || 
                 { diesel: { capacidade: 0, atual: 0 }, arla: { capacidade: 0, atual: 0 } };
  
  // Cálculo de métricas para o resumo
  const percentualDiesel = Math.round((tanques.diesel.atual / tanques.diesel.capacidade) * 100);
  const percentualArla = Math.round((tanques.arla.atual / tanques.arla.capacidade) * 100);
  const mediaConsumo = 2500; // Litros por dia - em uma implementação real seria calculado
  
  // Estimativa de dias restantes
  const diasDiesel = Math.floor(tanques.diesel.atual / mediaConsumo);
  const diasArla = Math.floor(tanques.arla.atual / (mediaConsumo * 0.05)); // ARLA tem consumo menor
  
  return (
    <TabsContent value="status" className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status dos Tanques
          </CardTitle>
          <CardDescription>
            Acompanhamento dos níveis de combustível e estimativa de autonomia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="bg-muted/30 rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Tanque Diesel</p>
                  <p className="text-2xl font-bold">{percentualDiesel}%</p>
                  <p className="text-xs text-muted-foreground">Capacidade: {tanques.diesel.capacidade.toLocaleString('pt-BR')}L</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Volume Atual</p>
                  <p className="text-2xl font-bold">{tanques.diesel.atual.toLocaleString('pt-BR')}L</p>
                  <p className="text-xs text-muted-foreground">Diesel disponível</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Autonomia Estimada</p>
                  <p className="text-2xl font-bold">{diasDiesel} dias</p>
                  <p className="text-xs text-muted-foreground">Com base no consumo médio</p>
                </div>
              </div>
            </div>
            
            <StatusTanque 
              tipo="Diesel" 
              capacidade={tanques.diesel.capacidade} 
              atual={tanques.diesel.atual} 
              ultimoRecebimento={tanques.diesel.ultimoRecebimento} 
            />
            
            <StatusTanque 
              tipo="ARLA" 
              capacidade={tanques.arla.capacidade} 
              atual={tanques.arla.atual}
              ultimoRecebimento={tanques.arla.ultimoRecebimento}
            />
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground border-t pt-4">
            <p>• O consumo médio é calculado com base no histórico dos últimos 30 dias.</p>
            <p>• A autonomia estimada considera apenas dias úteis e operação normal.</p>
            <p>• Recomenda-se agendar recebimento quando o nível atingir 30%.</p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default StatusTanquePosto;