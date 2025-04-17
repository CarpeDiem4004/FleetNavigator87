import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Fuel, Droplet } from 'lucide-react';
import { ENDPOINTS, buscarDadosSupabase } from '@/constants/supabase';

interface StatusTanqueProps {
  postId: string;
}

interface AbastecimentoData {
  tipo_combustivel: string;
  litros: number;
}

interface RecebimentoData {
  tipo_produto: string;
  litros_recebidos: number;
}

interface StatusTanque {
  diesel: {
    nivel: number;
    capacidade: number;
    porcentagem: number;
    ultimosAbastecimentos: number;
    ultimosRecebimentos: number;
  };
  arla: {
    nivel: number;
    capacidade: number;
    porcentagem: number;
    ultimosAbastecimentos: number;
    ultimosRecebimentos: number;
  };
}

export const StatusTanquePosto: React.FC<StatusTanqueProps> = ({ postId }) => {
  const [statusTanque, setStatusTanque] = useState<StatusTanque>({
    diesel: {
      nivel: 5000,
      capacidade: 20000,
      porcentagem: 25,
      ultimosAbastecimentos: 0,
      ultimosRecebimentos: 0
    },
    arla: {
      nivel: 1000,
      capacidade: 5000,
      porcentagem: 20,
      ultimosAbastecimentos: 0,
      ultimosRecebimentos: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDados() {
      try {
        setIsLoading(true);
        
        // Buscar abastecimentos usando a nova função
        const queryParamsAbastecimentos = `posto=eq.${postId}&order=created_at.desc&limit=50`;
        const abastecimentos = await buscarDadosSupabase(ENDPOINTS.ABASTECIMENTOS, queryParamsAbastecimentos);
        
        // Buscar recebimentos usando a nova função
        const queryParamsRecebimentos = `posto=eq.${postId}&order=created_at.desc&limit=50`;
        const recebimentos = await buscarDadosSupabase(ENDPOINTS.RECEBIMENTOS, queryParamsRecebimentos);
        
        // Calcular totais
        const totalDieselAbastecido = abastecimentos
          .filter((a: AbastecimentoData) => a.tipo_combustivel === 'Diesel')
          .reduce((acc: number, curr: AbastecimentoData) => acc + curr.litros, 0);
          
        const totalArlaAbastecido = abastecimentos
          .filter((a: AbastecimentoData) => a.tipo_combustivel === 'ARLA')
          .reduce((acc: number, curr: AbastecimentoData) => acc + curr.litros, 0);
          
        const totalDieselRecebido = recebimentos
          .filter((r: RecebimentoData) => r.tipo_produto === 'Diesel')
          .reduce((acc: number, curr: RecebimentoData) => acc + curr.litros_recebidos, 0);
          
        const totalArlaRecebido = recebimentos
          .filter((r: RecebimentoData) => r.tipo_produto === 'ARLA')
          .reduce((acc: number, curr: RecebimentoData) => acc + curr.litros_recebidos, 0);
        
        // Calcular níveis atuais e porcentagens
        const nivelDiesel = Math.min(statusTanque.diesel.capacidade, 5000 - totalDieselAbastecido + totalDieselRecebido);
        const nivelArla = Math.min(statusTanque.arla.capacidade, 1000 - totalArlaAbastecido + totalArlaRecebido);
        
        const porcentagemDiesel = (nivelDiesel / statusTanque.diesel.capacidade) * 100;
        const porcentagemArla = (nivelArla / statusTanque.arla.capacidade) * 100;
        
        setStatusTanque({
          diesel: {
            ...statusTanque.diesel,
            nivel: nivelDiesel > 0 ? nivelDiesel : 0,
            porcentagem: porcentagemDiesel > 0 ? porcentagemDiesel : 0,
            ultimosAbastecimentos: totalDieselAbastecido,
            ultimosRecebimentos: totalDieselRecebido
          },
          arla: {
            ...statusTanque.arla,
            nivel: nivelArla > 0 ? nivelArla : 0,
            porcentagem: porcentagemArla > 0 ? porcentagemArla : 0,
            ultimosAbastecimentos: totalArlaAbastecido,
            ultimosRecebimentos: totalArlaRecebido
          }
        });
      } catch (error) {
        console.error('Erro ao buscar dados de tanques:', error);
        // Em caso de erro, manter os valores padrão
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDados();
  }, [postId]);
  
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Fuel className="h-5 w-5" />
            Tanque de Diesel
          </CardTitle>
          <CardDescription>
            Monitoramento do nível de diesel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Nível atual:</span>
              <span className="font-medium">{formatarNumero(statusTanque.diesel.nivel)} / {formatarNumero(statusTanque.diesel.capacidade)} L</span>
            </div>
            <Progress 
              value={statusTanque.diesel.porcentagem} 
              className={`h-3 ${statusTanque.diesel.porcentagem < 20 ? "bg-red-500/30" : "bg-amber-500/30"}`}
              // O component Progress não tem indicatorClassName, então usamos className diretamente
            />
          </div>
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/30 p-2 rounded-md">
                <p className="text-muted-foreground">Abastecido:</p>
                <p className="font-medium">{formatarNumero(statusTanque.diesel.ultimosAbastecimentos)} L</p>
              </div>
              <div className="bg-muted/30 p-2 rounded-md">
                <p className="text-muted-foreground">Recebido:</p>
                <p className="font-medium">{formatarNumero(statusTanque.diesel.ultimosRecebimentos)} L</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
          Última atualização: {new Date().toLocaleTimeString()}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Droplet className="h-5 w-5" />
            Tanque de ARLA
          </CardTitle>
          <CardDescription>
            Monitoramento do nível de ARLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Nível atual:</span>
              <span className="font-medium">{formatarNumero(statusTanque.arla.nivel)} / {formatarNumero(statusTanque.arla.capacidade)} L</span>
            </div>
            <Progress 
              value={statusTanque.arla.porcentagem} 
              className={`h-3 ${statusTanque.arla.porcentagem < 20 ? "bg-red-500/30" : "bg-blue-500/30"}`}
            />
          </div>
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/30 p-2 rounded-md">
                <p className="text-muted-foreground">Abastecido:</p>
                <p className="font-medium">{formatarNumero(statusTanque.arla.ultimosAbastecimentos)} L</p>
              </div>
              <div className="bg-muted/30 p-2 rounded-md">
                <p className="text-muted-foreground">Recebido:</p>
                <p className="font-medium">{formatarNumero(statusTanque.arla.ultimosRecebimentos)} L</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
          Última atualização: {new Date().toLocaleTimeString()}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StatusTanquePosto;