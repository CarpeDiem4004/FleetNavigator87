import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel, Droplet, Settings, Edit, Save, RefreshCw, DollarSign } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from '@/lib/queryClient';
import TanqueConfigDialog from '@/components/posto-dialogs/TanqueConfigDialog';
import PrecosCombustivelDialog from '@/components/posto-dialogs/PrecosCombustivelDialog';
import PrecosCombustivelCard from '@/components/posto-cards/PrecosCombustivelCard';

export interface StatusTanqueRef {
  refreshData: () => Promise<void>;
}

interface StatusTanqueProps {
  postId: string;
  onRefreshComplete?: () => void;
}

interface AbastecimentoData {
  tipo_combustivel: string;
  litros: number;
}

interface RecebimentoData {
  tipo_combustivel: string;
  quantidade_litros: string;
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
  diesel_consumo_total?: number;
  diesel_valor_total?: number;
  arla_consumo_total?: number;
  arla_valor_total?: number;
  created_at?: string;
  updated_at?: string;
}

export const StatusTanquePosto = forwardRef<StatusTanqueRef, StatusTanqueProps>((props, ref) => {
  const { postId, onRefreshComplete } = props;
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
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
  const [isPrecosDialogOpen, setIsPrecosDialogOpen] = useState(false);
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
  
  // Estados para armazenar os totais de consumo e valor
  const [dieselConsumoTotal, setDieselConsumoTotal] = useState<number>(0);
  const [dieselValorTotal, setDieselValorTotal] = useState<number>(0);
  const [arlaConsumoTotal, setArlaConsumoTotal] = useState<number>(0);
  const [arlaValorTotal, setArlaValorTotal] = useState<number>(0);
  
  const [isSalvando, setIsSalvando] = useState(false);
  
  // Expor o método refreshData para componentes pais
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      console.log("Atualizando dados do tanque após novo abastecimento");
      await fetchDados();
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  }));
  
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
          setDieselValorLitro(Number(configLocal.diesel_valor_litro));
          setDieselStatusValorLitro(Number(configLocal.diesel_valor_litro));
        }
        if (configLocal.arla_valor_litro) {
          setArlaValorLitro(Number(configLocal.arla_valor_litro));
          setArlaStatusValorLitro(Number(configLocal.arla_valor_litro));
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
          setDieselNivel(Number(config.diesel_nivel));
          setDieselCapacidade(Number(config.diesel_capacidade));
          setArlaNivel(Number(config.arla_nivel));
          setArlaCapacidade(Number(config.arla_capacidade));
          
          // Atualizar os valores de preço por litro se existirem
          if (config.diesel_valor_litro) {
            setDieselValorLitro(Number(config.diesel_valor_litro));
            setDieselStatusValorLitro(Number(config.diesel_valor_litro));
          }
          if (config.arla_valor_litro) {
            setArlaValorLitro(Number(config.arla_valor_litro));
            setArlaStatusValorLitro(Number(config.arla_valor_litro));
          }
          
          // Atualizar os valores de consumo total e valor total
          if (config.diesel_consumo_total !== undefined) {
            setDieselConsumoTotal(Number(config.diesel_consumo_total));
          }
          if (config.diesel_valor_total !== undefined) {
            setDieselValorTotal(Number(config.diesel_valor_total));
          }
          if (config.arla_consumo_total !== undefined) {
            setArlaConsumoTotal(Number(config.arla_consumo_total));
          }
          if (config.arla_valor_total !== undefined) {
            setArlaValorTotal(Number(config.arla_valor_total));
          }
          
          // Salvar também no localStorage como backup
          saveStoredConfig(postId, config);
          
          // Retornar as configurações
          return {
            dieselNivel: Number(config.diesel_nivel),
            dieselCapacidade: Number(config.diesel_capacidade),
            arlaNivel: Number(config.arla_nivel),
            arlaCapacidade: Number(config.arla_capacidade)
          };
        }
      } catch (apiError) {
        console.log("API não disponível, usando apenas localStorage:", apiError);
        
        // Se temos configuração local, retornamos ela
        if (configLocal) {
          return {
            dieselNivel: Number(configLocal.diesel_nivel),
            dieselCapacidade: Number(configLocal.diesel_capacidade),
            arlaNivel: Number(configLocal.arla_nivel),
            arlaCapacidade: Number(configLocal.arla_capacidade)
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
        setDieselValorLitro(Number(configLocal.diesel_valor_litro));
        console.log("Definindo valor do diesel do localStorage:", configLocal.diesel_valor_litro);
      }
      if (configLocal.arla_valor_litro) {
        setArlaValorLitro(Number(configLocal.arla_valor_litro));
        console.log("Definindo valor do ARLA do localStorage:", configLocal.arla_valor_litro);
      }
    }
    
    // Abrir o diálogo
    setIsDialogOpen(true);
  };
  
  // Função para buscar os dados de abastecimentos
  const fetchAbastecimentos = async (posto: string) => {
    try {
      // Formatar o posto
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
  
  // Função para buscar os dados de recebimentos
  const fetchRecebimentos = async (posto: string) => {
    try {
      // Formatar o posto
      const formattedPosto = formatPosto(posto);
      console.log("[FETCH] Buscando recebimentos para o posto:", formattedPosto);
      
      // Usar a nova API para obter os recebimentos com autenticação
      const response = await apiRequest('GET', `/api/recebimentos/${posto}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar recebimentos: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error) {
      console.error('[FETCH] Erro ao buscar recebimentos:', error);
      return [];
    }
  };
  
  // Função principal para atualizar o dashboard
  const fetchDados = async () => {
    try {
      console.log("[FETCH] Iniciando atualização de dados para:", postId);
      setIsLoading(true);
      
      // Buscar as configurações dos tanques
      const config = await fetchConfigTanques();
      
      // Buscar os últimos abastecimentos
      const abastecimentos = await fetchAbastecimentos(postId);
      const recebimentos = await fetchRecebimentos(postId) || [];
      
      // Calcular o total de abastecimentos (últimos 7 dias ou algo assim)
      const totalDieselAbastecido = abastecimentos
        .filter((a: AbastecimentoData) => a.tipo_combustivel === 'Diesel')
        .reduce((acc: number, curr: AbastecimentoData) => acc + parseFloat(curr.litros as any), 0);
        
      const totalArlaAbastecido = abastecimentos
        .filter((a: AbastecimentoData) => a.tipo_combustivel === 'ARLA')
        .reduce((acc: number, curr: AbastecimentoData) => acc + parseFloat(curr.litros as any), 0);
      
      // Calcular o total de recebimentos (últimos 7 dias ou algo assim)
      const totalDieselRecebido = recebimentos
        .filter((r: RecebimentoData) => r.tipo_combustivel?.toLowerCase() === 'diesel')
        .reduce((acc: number, curr: RecebimentoData) => acc + parseFloat(curr.quantidade_litros || '0'), 0);
        
      const totalArlaRecebido = recebimentos
        .filter((r: RecebimentoData) => r.tipo_combustivel?.toLowerCase() === 'arla')
        .reduce((acc: number, curr: RecebimentoData) => acc + parseFloat(curr.quantidade_litros || '0'), 0);
      
      // Verificar se temos configuração local ou da API
      const configLocal = getStoredConfig(postId);
        
      // Determinar capacidade e nível base com base nas configurações ou valores padrão
      // Prioridade: 1) Configuração da API, 2) Configuração local, 3) Valores padrão
      const dieselCapacidade = Number(
        (config && config.dieselCapacidade) || 
        (configLocal && configLocal.diesel_capacidade) || 
        statusTanque.diesel.capacidade
      );
        
      const nivelDieselBase = Number(
        (config && config.dieselNivel) || 
        (configLocal && configLocal.diesel_nivel) || 
        5000
      );
        
      const arlaCapacidade = Number(
        (config && config.arlaCapacidade) || 
        (configLocal && configLocal.arla_capacidade) || 
        statusTanque.arla.capacidade
      );
        
      const nivelArlaBase = Number(
        (config && config.arlaNivel) || 
        (configLocal && configLocal.arla_nivel) || 
        1000
      );
      
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
  
  // Efeito para atualizar os dados quando o componente montar
  useEffect(() => {
    fetchDados();

    // Configurar atualização automática a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log("Atualizando dados automaticamente...");
      fetchDados();
    }, 30000); // 30 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [postId]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-yellow-600" />
              <span>Diesel</span>
            </CardTitle>
            <CardDescription>Nível atual do tanque</CardDescription>
          </div>
          <div className="text-2xl font-bold text-right">
            {Math.round(statusTanque.diesel.nivel).toLocaleString()} L
            <div className="text-sm font-normal text-muted-foreground">
              de {Math.round(statusTanque.diesel.capacidade).toLocaleString()} L
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <Progress value={statusTanque.diesel.porcentagem} max={100} className="h-4" />
            <div className="text-xs text-right mt-1">
              {statusTanque.diesel.porcentagem.toFixed(1)}%
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div>
              <span className="text-muted-foreground">Abastecimentos recentes:</span>
              <div className="font-medium">{Math.round(statusTanque.diesel.ultimosAbastecimentos).toLocaleString()} L</div>
            </div>
            <div>
              <span className="text-muted-foreground">Recebimentos recentes:</span>
              <div className="font-medium">{Math.round(statusTanque.diesel.ultimosRecebimentos).toLocaleString()} L</div>
            </div>
          </div>
          
          <div className="border-t border-border mt-4 pt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Consumo total:</span>
                <div className="font-medium">{Number(dieselConsumoTotal).toLocaleString()} L</div>
              </div>
              <div>
                <span className="text-muted-foreground">Valor total:</span>
                <div className="font-medium">R$ {Number(dieselValorTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              <span>ARLA 32</span>
            </CardTitle>
            <CardDescription>Nível atual do tanque</CardDescription>
          </div>
          <div className="text-2xl font-bold text-right">
            {Math.round(statusTanque.arla.nivel).toLocaleString()} L
            <div className="text-sm font-normal text-muted-foreground">
              de {Math.round(statusTanque.arla.capacidade).toLocaleString()} L
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <Progress value={statusTanque.arla.porcentagem} max={100} className="h-4" />
            <div className="text-xs text-right mt-1">
              {statusTanque.arla.porcentagem.toFixed(1)}%
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div>
              <span className="text-muted-foreground">Abastecimentos recentes:</span>
              <div className="font-medium">{Math.round(statusTanque.arla.ultimosAbastecimentos).toLocaleString()} L</div>
            </div>
            <div>
              <span className="text-muted-foreground">Recebimentos recentes:</span>
              <div className="font-medium">{Math.round(statusTanque.arla.ultimosRecebimentos).toLocaleString()} L</div>
            </div>
          </div>
          
          <div className="border-t border-border mt-4 pt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Consumo total:</span>
                <div className="font-medium">{Number(arlaConsumoTotal).toLocaleString()} L</div>
              </div>
              <div>
                <span className="text-muted-foreground">Valor total:</span>
                <div className="font-medium">R$ {Number(arlaValorTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle>Preços do Combustível</CardTitle>
            <CardDescription>Valores por litro</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPrecosDialogOpen(true)} className="gap-1">
              <DollarSign className="h-4 w-4" />
              Preços
            </Button>
            <Button variant="outline" size="sm" onClick={abrirDialogEdicao} className="gap-1">
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
            <Button variant="outline" size="sm" onClick={fetchDados} className="gap-1" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PrecosCombustivelCard 
            dialogControl={{
              isOpen: false,
              onOpen: () => {},
              onClose: () => {}
            }}
          />
        </CardContent>
      </Card>
      
      {/* O diálogo de configuração foi movido para o final do componente */}
      
      {/* Diálogo de configuração do tanque */}
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
          
          // Salvar as configurações
          await salvarConfigTanques();
        }}
      />
      
      {/* Diálogo de preços de combustível */}
      <PrecosCombustivelDialog 
        isOpen={isPrecosDialogOpen} 
        onClose={() => setIsPrecosDialogOpen(false)} 
        onSave={fetchDados}
      />
    </div>
  );
});

export default StatusTanquePosto;