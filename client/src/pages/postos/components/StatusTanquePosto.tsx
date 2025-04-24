import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel, Droplet, Settings, Edit, Save, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import TanqueConfigDialog from '@/components/posto-dialogs/TanqueConfigDialog';
import PrecosCombustivelCard from '@/components/posto-cards/PrecosCombustivelCard';
import PrecosCombustivelDialog from '@/components/posto-dialogs/PrecosCombustivelDialog';

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
  diesel_valor_litro?: number;
  arla_valor_litro?: number;
  created_at?: string;
  updated_at?: string;
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
  const [dieselValorLitro, setDieselValorLitro] = useState<number>(5.00);
  const [arlaNivel, setArlaNivel] = useState<number>(statusTanque.arla.nivel);
  const [arlaCapacidade, setArlaCapacidade] = useState<number>(statusTanque.arla.capacidade);
  const [arlaValorLitro, setArlaValorLitro] = useState<number>(3.00);
  
  // Estados para armazenar os valores do litro no objeto de status
  const [dieselStatusValorLitro, setDieselStatusValorLitro] = useState<number>(5.00);
  const [arlaStatusValorLitro, setArlaStatusValorLitro] = useState<number>(3.00);
  const [isSalvando, setIsSalvando] = useState(false);
  
  // Mapa de configurações em memória (sem necessidade de API)
  // Usamos localStorage para persistir os dados entre sessões
  const getStoredConfig = (posto: string) => {
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
  
  const saveStoredConfig = (posto: string, config: ConfiguracaoTanques) => {
    try {
      localStorage.setItem(`config_tanques_${posto}`, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Erro ao salvar configuração no localStorage:", e);
      return false;
    }
  };
  
  // Função para formatar posto (primeira letra maiúscula)
  const formatPosto = (posto: string) => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };

  // Função para buscar configurações do tanque
  const fetchConfigTanques = async () => {
    try {
      // Primeiro tentamos buscar do localStorage
      const configLocal = getStoredConfig(postId);
      
      if (configLocal) {
        console.log("Configuração carregada do localStorage:", configLocal);
        
        // Atualizar os estados do formulário
        setDieselNivel(configLocal.diesel_nivel);
        setDieselCapacidade(configLocal.diesel_capacidade);
        setArlaNivel(configLocal.arla_nivel);
        setArlaCapacidade(configLocal.arla_capacidade);
        
        // Atualizar os valores de litro se existirem
        if (configLocal.diesel_valor_litro) {
          setDieselValorLitro(configLocal.diesel_valor_litro);
          setDieselStatusValorLitro(configLocal.diesel_valor_litro);
        }
        if (configLocal.arla_valor_litro) {
          setArlaValorLitro(configLocal.arla_valor_litro);
          setArlaStatusValorLitro(configLocal.arla_valor_litro);
        }
      }
      
      // Independente de encontrar local, tenta buscar da API (PostgreSQL)
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
          
          // Atualizar os valores de preço por litro se existirem
          if (config.diesel_valor_litro) {
            setDieselValorLitro(config.diesel_valor_litro);
            setDieselStatusValorLitro(config.diesel_valor_litro);
          }
          if (config.arla_valor_litro) {
            setArlaValorLitro(config.arla_valor_litro);
            setArlaStatusValorLitro(config.arla_valor_litro);
          }
          
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
      } catch (apiError) {
        console.log("API não disponível, usando apenas localStorage:", apiError);
        
        // Se temos configuração local, retornamos ela
        if (configLocal) {
          return {
            dieselNivel: configLocal.diesel_nivel,
            dieselCapacidade: configLocal.diesel_capacidade,
            arlaNivel: configLocal.arla_nivel,
            arlaCapacidade: configLocal.arla_capacidade
          };
        }
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
        diesel_valor_litro: Number(dieselValorLitro),
        arla_capacidade: capacidadeArla,
        arla_nivel: nivelArla,
        arla_valor_litro: Number(arlaValorLitro)
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
          if (result.data.id) {
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
        
        // Atualizar os valores do status
        setDieselStatusValorLitro(Number(dieselValorLitro));
        setArlaStatusValorLitro(Number(arlaValorLitro));
        
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
  
  // Função para abrir o diálogo de edição
  const abrirDialogEdicao = () => {
    console.log("Abrindo diálogo de edição com valores:", {
      diesel_nivel: statusTanque.diesel.nivel,
      diesel_capacidade: statusTanque.diesel.capacidade,
      diesel_valor_litro: dieselStatusValorLitro,
      arla_nivel: statusTanque.arla.nivel,
      arla_capacidade: statusTanque.arla.capacidade,
      arla_valor_litro: arlaStatusValorLitro
    });
    
    // Preencher o formulário com os valores atuais
    setDieselNivel(statusTanque.diesel.nivel);
    setDieselCapacidade(statusTanque.diesel.capacidade);
    setArlaNivel(statusTanque.arla.nivel);
    setArlaCapacidade(statusTanque.arla.capacidade);
    
    // Definir os valores por litro dos estados (mesmo que o usuário não clique no localStorage)
    setDieselValorLitro(dieselStatusValorLitro);
    setArlaValorLitro(arlaStatusValorLitro);
    
    // Verificar se existe configuração local para pegar os valores de preço
    const configLocal = getStoredConfig(postId);
    if (configLocal) {
      if (configLocal.diesel_valor_litro) {
        setDieselValorLitro(configLocal.diesel_valor_litro);
        console.log("Definindo valor do diesel do localStorage:", configLocal.diesel_valor_litro);
      }
      if (configLocal.arla_valor_litro) {
        setArlaValorLitro(configLocal.arla_valor_litro);
        console.log("Definindo valor do ARLA do localStorage:", configLocal.arla_valor_litro);
      }
    }
    
    // Abrir o diálogo
    setIsDialogOpen(true);
  };

  const fetchAbastecimentos = async (posto: string) => {
    try {
      // Formatar o nome do posto para primeira letra maiúscula
      const formattedPosto = formatPosto(posto);
      console.log("[FETCH] Buscando abastecimentos para o posto:", formattedPosto);
      
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
  
  const fetchRecebimentos = async (posto: string) => {
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

  // Adiciona um botão para atualizar os dados
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDados().finally(() => {
      setIsRefreshing(false);
    });
  };
  
  // Define a fetchDados function 
  const fetchDados = async () => {
    try {
      setIsLoading(true);
      
      // Primeiro tenta carregar as configurações locais
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
        
        setIsLoading(false);
        
        // Continue tentando buscar dados da API em segundo plano
      }
      
      // Buscar configurações de tanques da API
      const config = await fetchConfigTanques();
      
      // Tenta buscar abastecimentos e recebimentos da API
      const abastecimentos = await fetchAbastecimentos(postId);
      const recebimentos = await fetchRecebimentos(postId);
      
      // Calcular totais dos abastecimentos
      const totalDieselAbastecido = Array.isArray(abastecimentos) 
        ? abastecimentos
            .filter((a: AbastecimentoData) => a.tipo_combustivel === 'Diesel')
            .reduce((acc: number, curr: AbastecimentoData) => acc + parseFloat(curr.litros as any), 0)
        : 0;
        
      const totalArlaAbastecido = Array.isArray(abastecimentos)
        ? abastecimentos
            .filter((a: AbastecimentoData) => a.tipo_combustivel === 'ARLA')
            .reduce((acc: number, curr: AbastecimentoData) => acc + parseFloat(curr.litros as any), 0)
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
  };
  
  // Use effect to fetch data when component mounts
  useEffect(() => {
    fetchDados();
  }, [postId]);
  
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
  };
  
  const [isPrecoDialogOpen, setIsPrecoDialogOpen] = useState(false);
  
  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Status dos Tanques</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => fetchDados()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={abrirDialogEdicao}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsPrecoDialogOpen(true)}
          >
            <Fuel className="h-4 w-4" />
            Preços
          </Button>
        </div>
      </div>

      {/* Novo card de preços dos combustíveis com novas funcionalidades */}
      <PrecosCombustivelCard />
      
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
              <div className="flex justify-between text-sm mb-1">
                <span>Valor por litro:</span>
                <span className="font-medium text-green-600">R$ {dieselStatusValorLitro?.toFixed(2).replace('.', ',')}</span>
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
              <div className="flex justify-between text-sm mb-1">
                <span>Valor por litro:</span>
                <span className="font-medium text-green-600">R$ {arlaStatusValorLitro?.toFixed(2).replace('.', ',')}</span>
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
      <TanqueConfigDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dieselNivel={dieselNivel}
        dieselCapacidade={dieselCapacidade}
        dieselValorLitro={dieselValorLitro}
        arlaNivel={arlaNivel}
        arlaCapacidade={arlaCapacidade}
        arlaValorLitro={arlaValorLitro}
        onSave={async (config) => {
          // Atualizar os valores do estado com os valores do formulário
          setDieselNivel(config.dieselNivel);
          setDieselCapacidade(config.dieselCapacidade);
          setDieselValorLitro(config.dieselValorLitro);
          setArlaNivel(config.arlaNivel);
          setArlaCapacidade(config.arlaCapacidade);
          setArlaValorLitro(config.arlaValorLitro);
          
          // Chamar a função de salvamento original
          await salvarConfigTanques();
        }}
      />
      
      {/* Diálogo para configurar preços */}
      <PrecosCombustivelDialog 
        isOpen={isPrecoDialogOpen} 
        onClose={() => setIsPrecoDialogOpen(false)}
        onSave={() => {
          // Atualizar os valores dos preços na interface
          fetchDados();
          setIsPrecoDialogOpen(false);
        }}
      />
    </div>
  );
};

export default StatusTanquePosto;