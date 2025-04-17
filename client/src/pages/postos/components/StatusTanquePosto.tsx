import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Fuel, Droplet, Settings, Edit, Save } from 'lucide-react';
import { ENDPOINTS, buscarDadosSupabase, enviarParaSupabase } from '@/constants/supabase';
import { useToast } from "@/hooks/use-toast";

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

interface ConfiguracaoTanques {
  id?: number;
  posto: string;
  diesel_capacidade: number;
  diesel_nivel: number;
  arla_capacidade: number;
  arla_nivel: number;
}

export const StatusTanquePosto: React.FC<StatusTanqueProps> = ({ postId }) => {
  const { toast } = useToast();
  
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configId, setConfigId] = useState<number | undefined>(undefined);
  
  // Estados para os campos do formulário
  const [dieselNivel, setDieselNivel] = useState<number>(statusTanque.diesel.nivel);
  const [dieselCapacidade, setDieselCapacidade] = useState<number>(statusTanque.diesel.capacidade);
  const [arlaNivel, setArlaNivel] = useState<number>(statusTanque.arla.nivel);
  const [arlaCapacidade, setArlaCapacidade] = useState<number>(statusTanque.arla.capacidade);
  const [isSalvando, setIsSalvando] = useState(false);
  
  // Função para buscar configurações do tanque
  const fetchConfigTanques = async () => {
    try {
      // Buscar configuração atual dos tanques para este posto
      const queryParamsConfig = `posto=eq.${postId}`;
      const configTanques = await buscarDadosSupabase(ENDPOINTS.CONFIG_TANQUES, queryParamsConfig);
      
      if (configTanques && configTanques.length > 0) {
        const config = configTanques[0];
        setConfigId(config.id);
        
        // Atualizar os estados do formulário
        setDieselNivel(config.diesel_nivel);
        setDieselCapacidade(config.diesel_capacidade);
        setArlaNivel(config.arla_nivel);
        setArlaCapacidade(config.arla_capacidade);
        
        // Atualizar o estado principal com estes valores
        return {
          dieselNivel: config.diesel_nivel,
          dieselCapacidade: config.diesel_capacidade,
          arlaNivel: config.arla_nivel,
          arlaCapacidade: config.arla_capacidade
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar configurações dos tanques:', error);
      return null;
    }
  };
  
  // Função para salvar configurações do tanque
  const salvarConfigTanques = async () => {
    try {
      setIsSalvando(true);
      
      const dadosConfig: ConfiguracaoTanques = {
        posto: postId,
        diesel_capacidade: Number(dieselCapacidade),
        diesel_nivel: Number(dieselNivel),
        arla_capacidade: Number(arlaCapacidade),
        arla_nivel: Number(arlaNivel)
      };
      
      let response;
      
      if (configId) {
        // Atualizar registro existente
        response = await enviarParaSupabase(
          `${ENDPOINTS.CONFIG_TANQUES}?id=eq.${configId}`,
          dadosConfig,
          'PATCH'
        );
      } else {
        // Criar novo registro
        response = await enviarParaSupabase(
          ENDPOINTS.CONFIG_TANQUES,
          dadosConfig,
          'POST'
        );
      }
      
      if (response) {
        toast({
          title: "Configurações salvas",
          description: "Os níveis e capacidades dos tanques foram atualizados com sucesso.",
        });
        
        // Atualizar o estado principal com os novos valores
        setStatusTanque({
          diesel: {
            ...statusTanque.diesel,
            nivel: Number(dieselNivel),
            capacidade: Number(dieselCapacidade),
            porcentagem: (Number(dieselNivel) / Number(dieselCapacidade)) * 100,
          },
          arla: {
            ...statusTanque.arla,
            nivel: Number(arlaNivel),
            capacidade: Number(arlaCapacidade),
            porcentagem: (Number(arlaNivel) / Number(arlaCapacidade)) * 100,
          }
        });
        
        // Fechar o diálogo
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações dos tanques.",
      });
    } finally {
      setIsSalvando(false);
    }
  };
  
  // Função para abrir o diálogo de edição
  const abrirDialogEdicao = () => {
    // Preencher o formulário com os valores atuais
    setDieselNivel(statusTanque.diesel.nivel);
    setDieselCapacidade(statusTanque.diesel.capacidade);
    setArlaNivel(statusTanque.arla.nivel);
    setArlaCapacidade(statusTanque.arla.capacidade);
    
    // Abrir o diálogo
    setIsDialogOpen(true);
  };

  useEffect(() => {
    async function fetchDados() {
      try {
        setIsLoading(true);
        
        // Buscar configurações de tanques
        const config = await fetchConfigTanques();
        
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
        
        // Determinar capacidade e nível base com base nas configurações ou valores padrão
        const dieselCapacidade = config ? config.dieselCapacidade : statusTanque.diesel.capacidade;
        const nivelDieselBase = config ? config.dieselNivel : 5000;
        const arlaCapacidade = config ? config.arlaCapacidade : statusTanque.arla.capacidade;
        const nivelArlaBase = config ? config.arlaNivel : 1000;
        
        // Calcular níveis atuais e porcentagens
        const nivelDiesel = Math.min(dieselCapacidade, nivelDieselBase - totalDieselAbastecido + totalDieselRecebido);
        const nivelArla = Math.min(arlaCapacidade, nivelArlaBase - totalArlaAbastecido + totalArlaRecebido);
        
        const porcentagemDiesel = (nivelDiesel / dieselCapacidade) * 100;
        const porcentagemArla = (nivelArla / arlaCapacidade) * 100;
        
        setStatusTanque({
          diesel: {
            capacidade: dieselCapacidade,
            nivel: nivelDiesel > 0 ? nivelDiesel : 0,
            porcentagem: porcentagemDiesel > 0 ? porcentagemDiesel : 0,
            ultimosAbastecimentos: totalDieselAbastecido,
            ultimosRecebimentos: totalDieselRecebido
          },
          arla: {
            capacidade: arlaCapacidade,
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
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Status dos Tanques</h2>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={abrirDialogEdicao}
        >
          <Settings className="h-4 w-4" />
          Atualizar Configurações
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      
      {/* Diálogo para editar configurações */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configurar Tanques de Combustível</DialogTitle>
            <DialogDescription>
              Ajuste os níveis e capacidades dos tanques de Diesel e ARLA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-amber-600 flex items-center gap-2">
                <Fuel className="h-4 w-4" /> Tanque de Diesel
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dieselNivel">Nível Atual (L)</Label>
                  <Input
                    id="dieselNivel"
                    type="number"
                    value={dieselNivel}
                    onChange={(e) => setDieselNivel(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dieselCapacidade">Capacidade Total (L)</Label>
                  <Input
                    id="dieselCapacidade"
                    type="number"
                    value={dieselCapacidade}
                    onChange={(e) => setDieselCapacidade(Number(e.target.value))}
                    min={1000}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-blue-600 flex items-center gap-2">
                <Droplet className="h-4 w-4" /> Tanque de ARLA
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="arlaNivel">Nível Atual (L)</Label>
                  <Input
                    id="arlaNivel"
                    type="number"
                    value={arlaNivel}
                    onChange={(e) => setArlaNivel(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="arlaCapacidade">Capacidade Total (L)</Label>
                  <Input
                    id="arlaCapacidade"
                    type="number"
                    value={arlaCapacidade}
                    onChange={(e) => setArlaCapacidade(Number(e.target.value))}
                    min={100}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarConfigTanques} 
              disabled={isSalvando}
              className="flex items-center gap-2"
            >
              {isSalvando && <span className="animate-spin">⏳</span>}
              <Save className="h-4 w-4" />
              {isSalvando ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusTanquePosto;