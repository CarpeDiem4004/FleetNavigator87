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
  DialogTitle 
} from "@/components/ui/dialog";
import { Fuel, Droplet, Settings, Save, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface StatusTanqueProps {
  postId: string;
}

interface AbastecimentoData {
  tipo_combustivel: string;
  litros: string | number;
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
  created_at?: string;
  updated_at?: string;
}

export const StatusTanquePostoNew: React.FC<StatusTanqueProps> = ({ postId }) => {
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados para os campos do formulário
  const [dieselNivel, setDieselNivel] = useState<number>(statusTanque.diesel.nivel);
  const [dieselCapacidade, setDieselCapacidade] = useState<number>(statusTanque.diesel.capacidade);
  const [arlaNivel, setArlaNivel] = useState<number>(statusTanque.arla.nivel);
  const [arlaCapacidade, setArlaCapacidade] = useState<number>(statusTanque.arla.capacidade);
  const [isSalvando, setIsSalvando] = useState(false);
  
  // Função para formatar posto (primeira letra maiúscula)
  const formatPosto = (posto: string): string => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };

  // Mapa de configurações em memória (sem necessidade de API)
  // Usamos localStorage para persistir os dados entre sessões
  const getStoredConfig = (posto: string): ConfiguracaoTanques | null => {
    try {
      const storedConfig = localStorage.getItem(`config_tanques_${posto}`);
      if (storedConfig) {
        return JSON.parse(storedConfig);
      }
      return null;
    } catch (e) {
      console.error("Erro ao ler configuração do localStorage:", e);
      return null;
    }
  };
  
  const saveStoredConfig = (posto: string, config: ConfiguracaoTanques): boolean => {
    try {
      localStorage.setItem(`config_tanques_${posto}`, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Erro ao salvar configuração no localStorage:", e);
      return false;
    }
  };

  // Função para buscar abastecimentos da API
  const fetchAbastecimentos = async (posto: string): Promise<AbastecimentoData[]> => {
    try {
      console.log("[FETCH] Buscando abastecimentos para o posto:", posto);
      
      // Usar a nova API para obter os abastecimentos
      const response = await fetch(`/api/diagnostico/abastecimentos/${posto}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar abastecimentos: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        console.log("[FETCH] Dados recuperados via API local:", result.data.length);
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('[FETCH] Erro ao buscar abastecimentos:', error);
      return [];
    }
  };
  
  // Função para buscar recebimentos (por enquanto do localStorage)
  const fetchRecebimentos = async (posto: string): Promise<RecebimentoData[]> => {
    try {
      // Por enquanto, não temos uma API para recebimentos no PostgreSQL,
      // então tentamos usar os dados armazenados localmente
      const localKey = `recebimentos_combustivel_${posto}`;
      const storedData = localStorage.getItem(localKey);
      
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log("[FETCH] Recuperados recebimentos de combustível do localStorage:", data.length);
        return data;
      }
      
      return [];
    } catch (error) {
      console.error('[FETCH] Erro ao buscar recebimentos:', error);
      return [];
    }
  };

  // Função para buscar configuração dos tanques da API
  const fetchConfigTanques = async (): Promise<{
    dieselNivel: number;
    dieselCapacidade: number;
    arlaNivel: number;
    arlaCapacidade: number;
  } | null> => {
    try {
      // Formatar o nome do posto para primeira letra maiúscula
      const formattedPosto = formatPosto(postId);
      console.log("Buscando configurações de tanque para:", formattedPosto);
      
      // Fazer requisição para a nova API
      const response = await fetch(`/api/configuracao-tanques/${formattedPosto}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar configuração: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const config = result.data;
        console.log("Configuração de tanques obtida via API:", config);
        
        setConfigId(config.id);
        
        // Atualizar os estados do formulário
        setDieselNivel(config.diesel_nivel);
        setDieselCapacidade(config.diesel_capacidade);
        setArlaNivel(config.arla_nivel);
        setArlaCapacidade(config.arla_capacidade);
        
        // Salvar também no localStorage como backup
        saveStoredConfig(postId, config);
        
        // Retornar as configurações
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
      
      // Se houver erro, tente usar configuração local
      const configLocal = getStoredConfig(postId);
      if (configLocal) {
        return {
          dieselNivel: configLocal.diesel_nivel,
          dieselCapacidade: configLocal.diesel_capacidade,
          arlaNivel: configLocal.arla_nivel,
          arlaCapacidade: configLocal.arla_capacidade
        };
      }
      
      return null;
    }
  };
  
  // Função para salvar configurações do tanque
  const salvarConfigTanques = async (): Promise<void> => {
    try {
      setIsSalvando(true);
      
      // Verificar se todos os números são positivos
      const nivelDiesel = Number(dieselNivel);
      const capacidadeDiesel = Number(dieselCapacidade);
      const nivelArla = Number(arlaNivel);
      const capacidadeArla = Number(arlaCapacidade);
      
      if (nivelDiesel < 0 || capacidadeDiesel <= 0 || nivelArla < 0 || capacidadeArla <= 0) {
        throw new Error("Todos os valores devem ser números positivos e as capacidades devem ser maiores que zero.");
      }
      
      if (nivelDiesel > capacidadeDiesel) {
        throw new Error("O nível de diesel não pode ser maior que a capacidade.");
      }
      
      if (nivelArla > capacidadeArla) {
        throw new Error("O nível de ARLA não pode ser maior que a capacidade.");
      }
      
      // Formatar o nome do posto
      const formattedPosto = formatPosto(postId);
      
      const dadosConfig = {
        diesel_capacidade: capacidadeDiesel,
        diesel_nivel: nivelDiesel,
        arla_capacidade: capacidadeArla,
        arla_nivel: nivelArla
      };
      
      // Salvar localmente primeiro (independente da API)
      const savedLocally = saveStoredConfig(postId, {
        ...dadosConfig,
        posto: formattedPosto,
        updated_at: new Date().toISOString()
      } as ConfiguracaoTanques);
      
      let apiSuccess = false;
      
      // Tentar salvar na API (se disponível)
      try {
        // Fazer requisição para a nova API
        const response = await fetch(`/api/configuracao-tanques/${formattedPosto}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dadosConfig)
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao salvar configuração: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log("Configuração de tanques salva via API:", result.data);
          apiSuccess = true;
          
          // Atualizar o ID de configuração se for novo
          if (result.data && result.data.id) {
            setConfigId(result.data.id);
          }
        }
      } catch (apiError) {
        console.log("Não foi possível salvar na API, mas dados foram salvos localmente:", apiError);
      }
      
      if (savedLocally || apiSuccess) {
        toast({
          title: "Configurações salvas",
          description: !apiSuccess 
            ? "Os níveis e capacidades dos tanques foram salvos localmente."
            : "Os níveis e capacidades dos tanques foram atualizados com sucesso.",
        });
        
        // Atualizar o estado principal com os novos valores
        setStatusTanque({
          diesel: {
            ...statusTanque.diesel,
            nivel: nivelDiesel,
            capacidade: capacidadeDiesel,
            porcentagem: (nivelDiesel / capacidadeDiesel) * 100,
          },
          arla: {
            ...statusTanque.arla,
            nivel: nivelArla,
            capacidade: capacidadeArla,
            porcentagem: (nivelArla / capacidadeArla) * 100,
          }
        });
        
        // Fechar o diálogo
        setIsDialogOpen(false);
        
        // Atualizar dados
        await fetchDados();
      } else {
        throw new Error("Não foi possível salvar as configurações em nenhum local.");
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações dos tanques."
      });
    } finally {
      setIsSalvando(false);
    }
  };

  // Função principal para buscar todos os dados
  const fetchDados = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Primeiro tenta carregar as configurações locais para mostrar algo rápido
      const configLocal = getStoredConfig(postId);
      if (configLocal) {
        console.log("Usando configuração armazenada localmente para:", postId);
        
        // Atualizar o estado principal com as configurações locais
        setStatusTanque({
          diesel: {
            capacidade: configLocal.diesel_capacidade,
            nivel: configLocal.diesel_nivel,
            porcentagem: (configLocal.diesel_nivel / configLocal.diesel_capacidade) * 100,
            ultimosAbastecimentos: 0,
            ultimosRecebimentos: 0
          },
          arla: {
            capacidade: configLocal.arla_capacidade,
            nivel: configLocal.arla_nivel,
            porcentagem: (configLocal.arla_nivel / configLocal.arla_capacidade) * 100,
            ultimosAbastecimentos: 0,
            ultimosRecebimentos: 0
          }
        });
      }
      
      // Buscar configurações de tanques da API (pode sobrescrever as configurações locais)
      const config = await fetchConfigTanques();
      
      // Buscar abastecimentos e recebimentos
      const abastecimentos = await fetchAbastecimentos(postId);
      const recebimentos = await fetchRecebimentos(postId);
      
      // Adicionando mais logging para depuração
      console.log("[DEBUG] Abastecimentos data:", abastecimentos);
      
      // Calcular totais dos abastecimentos
      // Verificando os tipos de dados que estamos recebendo do servidor
      console.log("[DEBUG] Verificando formato dos abastecimentos:", 
        Array.isArray(abastecimentos) && abastecimentos.length > 0 
          ? abastecimentos[0] 
          : "Nenhum abastecimento encontrado");
      
      const totalDieselAbastecido = Array.isArray(abastecimentos) 
        ? abastecimentos
            .filter((a: AbastecimentoData) => a.tipo_combustivel === 'Diesel')
            .reduce((acc: number, curr: AbastecimentoData) => {
              console.log("[DEBUG] Processando abastecimento diesel:", curr);
              const litros = typeof curr.litros === 'string' 
                ? parseFloat(curr.litros) 
                : curr.litros;
              return acc + litros;
            }, 0)
        : 0;
        
      const totalArlaAbastecido = Array.isArray(abastecimentos)
        ? abastecimentos
            .filter((a: AbastecimentoData) => a.tipo_combustivel === 'ARLA')
            .reduce((acc: number, curr: AbastecimentoData) => {
              const litros = typeof curr.litros === 'string' 
                ? parseFloat(curr.litros) 
                : curr.litros;
              return acc + litros;
            }, 0)
        : 0;
        
      const totalDieselRecebido = Array.isArray(recebimentos)
        ? recebimentos
            .filter((r: RecebimentoData) => r.tipo_produto === 'Diesel')
            .reduce((acc: number, curr: RecebimentoData) => acc + curr.litros_recebidos, 0)
        : 0;
        
      const totalArlaRecebido = Array.isArray(recebimentos)
        ? recebimentos
            .filter((r: RecebimentoData) => r.tipo_produto === 'ARLA')
            .reduce((acc: number, curr: RecebimentoData) => acc + curr.litros_recebidos, 0)
        : 0;
        
      // Determinar capacidade e nível base com base nas configurações ou valores padrão
      // Prioridade: 1) Configuração da API, 2) Configuração local, 3) Valores padrão
      const dieselCapacidade = 
        (config && config.dieselCapacidade) || 
        (configLocal && configLocal.diesel_capacidade) || 
        statusTanque.diesel.capacidade;
        
      const nivelDieselBase = 
        (config && config.dieselNivel) || 
        (configLocal && configLocal.diesel_nivel) || 
        5000;
        
      const arlaCapacidade = 
        (config && config.arlaCapacidade) || 
        (configLocal && configLocal.arla_capacidade) || 
        statusTanque.arla.capacidade;
        
      const nivelArlaBase = 
        (config && config.arlaNivel) || 
        (configLocal && configLocal.arla_nivel) || 
        1000;
      
      // Calcular níveis atuais e porcentagens
      const nivelDiesel = Math.max(0, Math.min(dieselCapacidade, nivelDieselBase - totalDieselAbastecido + totalDieselRecebido));
      const nivelArla = Math.max(0, Math.min(arlaCapacidade, nivelArlaBase - totalArlaAbastecido + totalArlaRecebido));
      
      const porcentagemDiesel = dieselCapacidade > 0 ? (nivelDiesel / dieselCapacidade) * 100 : 0;
      const porcentagemArla = arlaCapacidade > 0 ? (nivelArla / arlaCapacidade) * 100 : 0;
      
      setStatusTanque({
        diesel: {
          capacidade: dieselCapacidade,
          nivel: nivelDiesel,
          porcentagem: porcentagemDiesel,
          ultimosAbastecimentos: totalDieselAbastecido,
          ultimosRecebimentos: totalDieselRecebido
        },
        arla: {
          capacidade: arlaCapacidade,
          nivel: nivelArla,
          porcentagem: porcentagemArla,
          ultimosAbastecimentos: totalArlaAbastecido,
          ultimosRecebimentos: totalArlaRecebido
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados de tanques:', error);
      // Em caso de erro, manter os valores padrão
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Função para abrir o diálogo de edição
  const abrirDialogEdicao = (): void => {
    // Preencher o formulário com os valores atuais
    setDieselNivel(statusTanque.diesel.nivel);
    setDieselCapacidade(statusTanque.diesel.capacidade);
    setArlaNivel(statusTanque.arla.nivel);
    setArlaCapacidade(statusTanque.arla.capacidade);
    
    // Abrir o diálogo
    setIsDialogOpen(true);
  };
  
  // Função para atualizar manualmente os dados
  const handleRefresh = (): void => {
    setIsRefreshing(true);
    fetchDados();
  };
  
  // Atualizar dados quando o componente montar ou quando o postId mudar
  useEffect(() => {
    fetchDados();
  }, [postId]);
  
  // Formatar números com separador de milhares
  const formatarNumero = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
  };
  
  // Renderizar indicador de carregamento quando necessário
  if (isLoading) {
    return (
      <div className="space-y-6 mt-6 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin text-primary mb-4 mx-auto inline-block w-8 h-8 border-4 rounded-full border-current border-t-transparent"></div>
          <p className="text-muted-foreground">Carregando dados dos tanques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Status dos Tanques</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={abrirDialogEdicao}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </div>
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
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={salvarConfigTanques}
              disabled={isSalvando}
            >
              {isSalvando ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};