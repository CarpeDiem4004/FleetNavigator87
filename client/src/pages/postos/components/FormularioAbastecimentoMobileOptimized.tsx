/**
 * Formulário de Abastecimento Otimizado para Mobile
 * Solução robusta para problemas de carregamento de projetos em links externos
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { useSafeState } from "@/hooks/useSafeState";

// Schema de validação
const abastecimentoSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória").max(8, "Placa deve ter no máximo 8 caracteres"),
  km: z.string().min(1, "Quilometragem é obrigatória"),
  tipo: z.string().min(1, "Tipo de combustível é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_litro: z.string().min(1, "Valor por litro é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  projeto_id: z.string().min(1, "Selecione um projeto"),
  base_id: z.string().min(1, "Selecione uma base"),
  motorista: z.string().min(1, "Nome do motorista é obrigatório"),
  motorista_rg: z.string().min(1, "RG do motorista é obrigatório"),
  operador: z.string().min(1, "Nome do operador é obrigatório"),
  tipo_veiculo: z.string().default("frota"),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;

interface FormularioAbastecimentoProps {
  postId: string;
  onRegistroSucesso?: () => void;
}

interface ProjectData {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  bases: Array<{
    id: number;
    base_name: string;
    base_code: string;
    description?: string;
  }>;
}

interface ConnectionStrategy {
  name: string;
  url: string;
  headers: Record<string, string>;
  timeout: number;
  credentials: RequestCredentials;
}

export const FormularioAbastecimentoMobileOptimized: React.FC<FormularioAbastecimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);
  
  // Detecção de dispositivo móvel
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const processingRef = useRef(false);
  
  // Estados para projetos e bases
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  // Estados de diagnóstico
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState<string>('initial');
  const [debugStatus, setDebugStatus] = useState(isMobile ? "Inicializando modo mobile..." : "Inicializando...");
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: "",
      km: "",
      tipo: "",
      quantidade: "",
      valor_litro: "",
      valor_total: "",
      projeto_id: "",
      base_id: "",
      motorista: "",
      motorista_rg: "",
      operador: "",
      tipo_veiculo: "frota",
    },
  });

  // Estratégias de conexão para diferentes cenários
  const getConnectionStrategies = useCallback((): ConnectionStrategy[] => {
    const origin = window.location.origin;
    const baseHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Mobile-Request': isMobile ? 'true' : 'false',
    };

    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const authHeaders = token ? { ...baseHeaders, 'Authorization': `Bearer ${token}` } : baseHeaders;

    return [
      {
        name: 'mobile_optimized',
        url: `${origin}/api/mobile/test-projects`,
        headers: { ...baseHeaders, 'X-Strategy': 'mobile-test' },
        timeout: 5000,
        credentials: 'omit'
      },
      {
        name: 'public_api',
        url: `${origin}/api/public/projects-with-bases`,
        headers: { ...baseHeaders, 'X-Strategy': 'public' },
        timeout: 10000,
        credentials: 'include'
      },
      {
        name: 'authenticated_api',
        url: `${origin}/api/projects-with-bases`,
        headers: { ...authHeaders, 'X-Strategy': 'authenticated' },
        timeout: 15000,
        credentials: 'include'
      },
      {
        name: 'fallback_direct',
        url: `${origin}/api/projects-with-bases`,
        headers: { ...baseHeaders, 'X-Strategy': 'fallback', 'X-Force-Reload': 'true' },
        timeout: 20000,
        credentials: 'omit'
      }
    ];
  }, [isMobile]);

  // Função principal para carregar projetos
  const loadProjects = useCallback(async () => {
    const attemptNumber = connectionAttempts + 1;
    setConnectionAttempts(attemptNumber);
    setIsLoadingProjects(true);

    const strategies = getConnectionStrategies();
    const strategyIndex = Math.min(attemptNumber - 1, strategies.length - 1);
    const strategy = strategies[strategyIndex];
    
    setCurrentStrategy(strategy.name);
    setDebugStatus(`Tentativa ${attemptNumber}: ${strategy.name}`);

    console.log(`[MOBILE-DIAGNOSTICO] Tentativa ${attemptNumber} usando estratégia: ${strategy.name}`);
    console.log(`[MOBILE-DIAGNOSTICO] URL: ${strategy.url}`);
    console.log(`[MOBILE-DIAGNOSTICO] Device Info:`, {
      isMobile,
      userAgent: navigator.userAgent.substring(0, 100),
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      timestamp: new Date().toISOString()
    });

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);

      const response = await fetch(strategy.url, {
        method: 'GET',
        headers: strategy.headers,
        credentials: strategy.credentials,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`[MOBILE-DIAGNOSTICO] Resposta em ${responseTime}ms - Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setProjects(data.data);
          setDebugStatus(`Sucesso: ${data.data.length} projetos carregados`);
          setLastError(null);
          setConnectionAttempts(0); // Reset para próximas tentativas
          
          console.log(`[MOBILE-DIAGNOSTICO] Sucesso! ${data.data.length} projetos carregados`);
          return;
        } else {
          throw new Error(`Dados inválidos recebidos: ${JSON.stringify(data).substring(0, 100)}`);
        }
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      setLastError(errorMessage);
      
      console.error(`[MOBILE-DIAGNOSTICO] Erro na tentativa ${attemptNumber}:`, {
        strategy: strategy.name,
        error: errorMessage,
        stack: error.stack?.substring(0, 200)
      });

      // Decidir se deve tentar novamente
      const shouldRetry = attemptNumber < strategies.length && (
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('CORS')
      );

      if (shouldRetry) {
        setDebugStatus(`Falha: ${errorMessage.substring(0, 30)}... Tentando novamente...`);
        
        // Agendar próxima tentativa com delay progressivo
        const delay = Math.min(attemptNumber * 1000, 5000);
        setTimeout(() => {
          setRetryTrigger(prev => prev + 1);
        }, delay);
      } else {
        setDebugStatus(`Falha final: ${errorMessage.substring(0, 50)}`);
        setProjects([]);
      }
    } finally {
      setIsLoadingProjects(false);
    }
  }, [connectionAttempts, getConnectionStrategies]);

  // Effect para carregar projetos
  useEffect(() => {
    loadProjects();
  }, [retryTrigger]); // Triggered by retry mechanism

  // Effect para resetar tentativas quando o componente é montado novamente
  useEffect(() => {
    const resetConnection = () => {
      setConnectionAttempts(0);
      setRetryTrigger(prev => prev + 1);
    };

    // Reset automático se não há projetos após 30 segundos
    const autoResetTimer = setTimeout(resetConnection, 30000);
    
    return () => clearTimeout(autoResetTimer);
  }, []);

  // Função para retry manual
  const handleManualRetry = () => {
    setConnectionAttempts(0);
    setLastError(null);
    setRetryTrigger(prev => prev + 1);
  };

  // Atualizar bases quando projeto é selecionado
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);

  // Submissão do formulário
  const processarSubmissao = async (data: AbastecimentoValues) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        posto_id: postId,
        data_abastecimento: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        mobile_device: isMobile,
        projeto_nome: selectedProject?.name || '',
        base_nome: selectedProject?.bases.find(b => b.id.toString() === data.base_id)?.base_name || ''
      };

      const response = await fetch(`${window.location.origin}/api/abastecimentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mobile-Request': isMobile ? 'true' : 'false'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setRegistroSucesso(true);
        toast({
          title: "Abastecimento registrado com sucesso!",
          description: `Placa: ${data.placa} - ${data.quantidade}L`,
        });

        form.reset();
        setSelectedProjectId("");
        setSelectedBaseId("");
        
        if (onRegistroSucesso) {
          onRegistroSucesso();
        }
      } else {
        const errorData = await response.text();
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
    } catch (error: any) {
      console.error('Erro ao registrar abastecimento:', error);
      toast({
        title: "Erro ao registrar abastecimento",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      processingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status de diagnóstico */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoadingProjects ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : projects.length > 0 ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
            <span className="text-sm font-medium">
              {isMobile ? "Modo Mobile" : "Modo Desktop"} - {debugStatus}
            </span>
          </div>
          {!isLoadingProjects && projects.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRetry}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar Novamente
            </Button>
          )}
        </div>
        {lastError && (
          <p className="text-xs text-red-600 mt-1">
            Último erro: {lastError}
          </p>
        )}
        <p className="text-xs text-gray-600 mt-1">
          Tentativas: {connectionAttempts} | Estratégia: {currentStrategy} | Projetos: {projects.length}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(processarSubmissao)} className="space-y-4">
          {/* Seleção de Projeto */}
          <FormField
            control={form.control}
            name="projeto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto *</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={selectedProjectId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedProjectId(value);
                      setSelectedBaseId("");
                      field.onChange(value);
                      form.setValue("base_id", "");
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={isLoadingProjects}
                  >
                    <option value="">
                      {isLoadingProjects ? "Carregando projetos..." : "Selecione um projeto"}
                    </option>
                    {projects.map((projeto) => (
                      <option key={projeto.id} value={projeto.id.toString()}>
                        {projeto.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seleção de Base */}
          <FormField
            control={form.control}
            name="base_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base *</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={selectedBaseId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedBaseId(value);
                      field.onChange(value);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={!selectedProjectId}
                  >
                    <option value="">Selecione uma base</option>
                    {selectedProject?.bases.map((base) => (
                      <option key={base.id} value={base.id.toString()}>
                        {base.base_name} ({base.base_code})
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos básicos do formulário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC-1234"
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quilometragem *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="12345"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível *</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Selecione o tipo</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="etanol">Etanol</option>
                      <option value="diesel">Diesel</option>
                      <option value="gnv">GNV</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade (Litros) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_litro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Litro *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.001"
                      placeholder="5.459"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="272.95"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motorista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Motorista *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome completo"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motorista_rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG do Motorista *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="12.345.678-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Operador *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome do operador"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || projects.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Abastecimento"
            )}
          </Button>

          {registroSucesso && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Abastecimento registrado com sucesso!
                </span>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default FormularioAbastecimentoMobileOptimized;