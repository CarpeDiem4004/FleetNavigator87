/**
 * Formulário de Abastecimento Simplificado - VERSÃO CORRIGIDA
 * Fix crítico para carregamento de projetos no link externo Osasco V2
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { useSafeState } from "@/hooks/useSafeState";
// import { useAuth } from "@/components/AuthContext"; // Temporariamente desabilitado

// Schema de validação
const abastecimentoSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória").max(8, "Placa deve ter no máximo 8 caracteres"),
  km: z.string().min(1, "Quilometragem é obrigatória"),
  tipo: z.string().min(1, "Tipo de combustível é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_litro: z.string().min(1, "Valor por litro é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  projeto: z.string().optional(), // Manter para compatibilidade
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

export const FormularioAbastecimento: React.FC<FormularioAbastecimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);
  
  // Mobile detection for touch optimization
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const processingRef = useRef(false);
  
  // Estados para projeto e base com prioridade mobile
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true); // Iniciar como carregando
  const [debugStatus, setDebugStatus] = useState(isMobile ? "📱 Carregando para mobile..." : "Inicializando...");

  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: "",
      km: "",
      tipo: "",
      quantidade: "",
      valor_litro: "6.39", // Valor padrão do diesel
      valor_total: "0",
      projeto: "",
      projeto_id: "",
      base_id: "",
      motorista: "",
      motorista_rg: "",
      operador: "",
      tipo_veiculo: "frota",

    },
  });

  // Carregar operador automaticamente
  useEffect(() => {
    
    // Carregar nome do operador logado automaticamente
    const carregarOperador = async () => {
      console.log('Carregando operador...');
      
      // Primeiro tentar localStorage (mais rápido)
      const userNameLS = localStorage.getItem('userName') || 
                        localStorage.getItem('currentUserName') ||
                        localStorage.getItem('user_name');
      
      if (userNameLS) {
        console.log('Operador encontrado no localStorage:', userNameLS);
        form.setValue("operador", userNameLS);
        return;
      }
      
      try {
        // Tentar API com token JWT
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/user', {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Dados do usuário da API:', userData);
          
          if (userData.name) {
            form.setValue("operador", userData.name);
            // Salvar no localStorage para próximas vezes
            localStorage.setItem('userName', userData.name);
            console.log('Operador definido:', userData.name);
          }
        } else {
          console.warn('API /user retornou erro:', response.status);
          // Fallback para nome padrão baseado no posto
          const defaultOperator = getDefaultOperatorForPosto(postId);
          if (defaultOperator) {
            form.setValue("operador", defaultOperator);
            console.log('Usando operador padrão:', defaultOperator);
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar operador da API:', error);
        // Fallback para nome padrão baseado no posto
        const defaultOperator = getDefaultOperatorForPosto(postId);
        if (defaultOperator) {
          form.setValue("operador", defaultOperator);
          console.log('Usando operador padrão:', defaultOperator);
        }
      }
    };

    // Função para obter operador padrão baseado no posto
    const getDefaultOperatorForPosto = (postoId: string): string | null => {
      const operatorMap: Record<string, string> = {
        'osasco_v2': 'Alair',
        'guarulhos_v2': 'Guarulhos',
        'abc_v2': 'ABC',
        'socorro_v2': 'Socorro',
        'sorocaba_v2': 'Sorocaba',
        'campinas_v2': 'Campinas',
        'goiania_v2': 'Goiânia'
      };
      return operatorMap[postoId] || null;
    };
    
    carregarOperador();
  }, [form]);

  // Carregar projetos automaticamente no mount (especialmente otimizado para mobile)
  useEffect(() => {
    let isCancelled = false;
    
    const fetchProjects = async () => {
      if (isCancelled) return;
      
      setIsLoadingProjects(true);
      
      setDebugStatus(`🔄 Carregando projetos...`);
      console.log(`[MOBILE-AUTO-LOAD] 📱 Iniciando carregamento automático para celular`);
      console.log(`[MOBILE-AUTO-LOAD] Device:`, {
        isMobile,
        isTouch: 'ontouchstart' in window,
        screenWidth: window.screen.width,
        userAgent: navigator.userAgent,
        origin: window.location.origin
      });
      
      try {
        const apiUrl = `${window.location.origin}/api/public/projects-with-bases`;
        console.log(`[AUTO-LOAD] 🔗 Fazendo requisição para: ${apiUrl}`);
        
        const startTime = Date.now();
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Mobile-Request': isMobile ? 'true' : 'false',
            'Cache-Control': 'no-cache'
          },
          credentials: 'include'
        });
        
        const responseTime = Date.now() - startTime;
        console.log(`[AUTO-LOAD] ⏱️ Tempo de resposta: ${responseTime}ms`);
        console.log(`[AUTO-LOAD] 📊 Status HTTP: ${response.status}`);
        console.log(`[AUTO-LOAD] 📋 Headers de resposta:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[AUTO-LOAD] 📦 Dados JSON recebidos:`, {
            success: data.success,
            dataType: typeof data.data,
            isArray: Array.isArray(data.data),
            length: data.data?.length || 0,
            firstProject: data.data?.[0]?.name || 'N/A'
          });
          
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            if (!isCancelled) {
              setProjects(data.data);
              setDebugStatus(`✅ ${data.data.length} projetos carregados automaticamente`);
              console.log(`[AUTO-LOAD] ✅ Projetos carregados com sucesso: ${data.data.length}`);
              console.log(`[AUTO-LOAD] 📋 Lista de projetos:`, data.data.map((p: any) => p.name).join(', '));
            }
          } else {
            console.error(`[AUTO-LOAD] ❌ Estrutura de dados inválida:`, data);
            setDebugStatus(`❌ Dados inválidos: ${JSON.stringify(data).substring(0, 50)}...`);
            if (!isCancelled) setProjects([]);
          }
        } else {
          const errorText = await response.text();
          console.error(`[AUTO-LOAD] ❌ Erro HTTP ${response.status}:`, errorText);
          setDebugStatus(`❌ HTTP ${response.status}: ${errorText.substring(0, 30)}...`);
          if (!isCancelled) setProjects([]);
        }
      } catch (error) {
        console.error(`[AUTO-LOAD] ❌ Erro de rede/JavaScript:`, error);
        setDebugStatus(`❌ Erro: ${String(error).substring(0, 50)}...`);
        if (!isCancelled) setProjects([]);
      } finally {
        if (!isCancelled) {
          setIsLoadingProjects(false);
        }
      }
    };

    // Carregamento imediato para celular - sem delay
    if (isMobile || 'ontouchstart' in window) {
      console.log(`[MOBILE-AUTO-LOAD] 🚀 Carregamento imediato ativado para mobile`);
      fetchProjects(); // Executar imediatamente para mobile
    } else {
      // Delay mínimo apenas para desktop
      const timer = setTimeout(fetchProjects, 50);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isCancelled = true;
    };
  }, []); // Executar apenas uma vez no mount

  // Obter projeto selecionado
  const selectedProject = projects.find((p: any) => p.id.toString() === selectedProjectId);
  const availableBases = selectedProject?.bases || [];

  // Atualizar projeto no formulário quando selecionado (com debounce para mobile)
  useEffect(() => {
    if (!selectedProjectId) return;

    const timeoutId = setTimeout(() => {
      form.setValue("projeto_id", selectedProjectId);
      const project = projects.find((p: any) => p.id.toString() === selectedProjectId);
      if (project) {
        form.setValue("projeto", project.name);
      }
      // Reset base quando projeto muda
      if (selectedBaseId) {
        setSelectedBaseId("");
        form.setValue("base_id", "");
      }
    }, isMobile ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [selectedProjectId, projects, isMobile]);

  // Atualizar base no formulário quando selecionada (com debounce para mobile)
  useEffect(() => {
    if (!selectedBaseId) return;

    const timeoutId = setTimeout(() => {
      form.setValue("base_id", selectedBaseId);
    }, isMobile ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [selectedBaseId, isMobile]);

  // Calcular valor total automaticamente
  const calcularValorTotal = useCallback(() => {
    const quantidade = form.watch("quantidade");
    const valorLitro = form.watch("valor_litro");
    
    if (quantidade && valorLitro) {
      const total = (parseFloat(quantidade) * parseFloat(valorLitro)).toFixed(2);
      form.setValue("valor_total", total);
    }
  }, [form]);

  // Atualizar valor por litro baseado no tipo de combustível
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "tipo") {
        if (value.tipo === "Diesel") {
          form.setValue("valor_litro", "6.39");
        } else if (value.tipo === "Arla") {
          form.setValue("valor_litro", "4.25");
        }
      }
      
      if (name === "quantidade" || name === "valor_litro") {
        calcularValorTotal();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, calcularValorTotal]);

  const processarSubmissao = async (data: AbastecimentoValues) => {
    if (processingRef.current) return;

    processingRef.current = true;
    setIsSubmitting(true);

    try {
      console.log(`[FormularioAbastecimento] Registrando para posto: ${postId}`);
      console.log(`[FormularioAbastecimento] Dados:`, data);

      // Preparar dados para envio com projeto_id e base_id
      const selectedProject = projects.find((p: any) => p.id.toString() === data.projeto_id);
      const selectedBase = selectedProject?.bases.find((b: any) => b.id.toString() === data.base_id);
      
      const dadosEnvio = {
        placa: data.placa.toUpperCase().trim(),
        km: Number(data.km),
        tipo_combustivel: data.tipo,
        quantidade: Number(data.quantidade),
        valor_litro: Number(data.valor_litro),
        valor_total: Number(data.valor_total),
        // Campos de projeto - enviar tanto nome quanto ID para compatibilidade
        projeto: selectedProject?.name || data.projeto || "NÃO ESPECIFICADO",
        projeto_id: Number(data.projeto_id),
        // Campos de base - enviar tanto nome quanto ID para compatibilidade
        base_name: selectedBase?.base_name || "",
        base_id: Number(data.base_id),
        motorista: data.motorista,
        motorista_rg: data.motorista_rg,
        operador: data.operador,
        tipo_veiculo: data.tipo_veiculo
      };

      // Dados mapeados corretamente para a tabela abastecimentos_posto_osasco_v2
      const dadosSupabase = {
        placa: dadosEnvio.placa,
        km_atual: dadosEnvio.km,
        hodometro_atual: null, // Campo opcional
        tipo_combustivel: dadosEnvio.tipo_combustivel,
        quantidade_litros: dadosEnvio.quantidade, // Será mapeado para 'litros' no servidor
        preco_litro: dadosEnvio.valor_litro, // Será mapeado para 'valor_litro' no servidor
        valor_total: dadosEnvio.valor_total,
        motorista: dadosEnvio.motorista,
        rg_motorista: dadosEnvio.motorista_rg,
        operador: dadosEnvio.operador,
        projeto: dadosEnvio.projeto,
        projeto_id: dadosEnvio.projeto_id,
        base_name: dadosEnvio.base_name,
        base_id: dadosEnvio.base_id,
        tipo_veiculo: dadosEnvio.tipo_veiculo,
        observacoes: "",
        lavagem: false, // Campo obrigatório na tabela
        tipo_lavagem: null // Campo opcional
      };
      
      console.log(`[FormularioAbastecimento] Dados sendo enviados:`, {
        table: 'abastecimentos_supabase',
        data: dadosSupabase,
        posto: postId.toLowerCase()
      });

      const response = await fetch('/api/supabase-insert', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          table: 'abastecimentos_supabase',
          data: dadosSupabase,
          posto: postId.toLowerCase()
        }),
      });

      console.log(`[FormularioAbastecimento] Status da resposta:`, response.status);
      
      const resultado = await response.json();
      console.log(`[FormularioAbastecimento] Resposta completa:`, resultado);

      if (response.ok && resultado.success) {
        console.log(`[FormularioAbastecimento] Sucesso:`, resultado);
        
        setRegistroSucesso(true);
        
        toast({
          title: "Abastecimento registrado!",
          description: `Abastecimento de ${data.quantidade}L registrado com sucesso.`,
        });

        // Limpar formulário
        form.reset();
        
        // Callback de sucesso
        if (onRegistroSucesso) {
          onRegistroSucesso();
        }

        // Remover o reload automático - deixar para o componente pai decidir
        
      } else {
        throw new Error(resultado.message || "Erro ao registrar abastecimento");
      }

    } catch (error) {
      console.error(`[FormularioAbastecimento] Erro:`, error);
      
      toast({
        title: "Erro ao registrar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      processingRef.current = false;
    }
  };

  if (registroSucesso) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border border-green-200">
        <Check className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Abastecimento Registrado!
        </h3>
        <p className="text-green-600 text-center mb-4">
          O registro foi salvo com sucesso no sistema.
        </p>
        <Button 
          onClick={() => {
            setRegistroSucesso(false);
            form.reset();
          }}
          variant="outline"
        >
          Registrar Novo Abastecimento
        </Button>
      </div>
    );
  }

  // Log de debugging para mobile
  console.log(`[Render-Debug] isMobile: ${isMobile}, projects: ${projects.length}, isLoading: ${isLoadingProjects}`);
  if (projects.length > 0) {
    console.log(`[Render-Debug] Primeiros 3 projetos:`, projects.slice(0, 3));
  }

  return (
    <div className="space-y-6">
      {/* Indicador para Mobile */}
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          📱 Modo Mobile Ativado - Interface otimizada para seu dispositivo
          <br />
          <strong>Debug:</strong> {projects.length} projetos carregados | Loading: {isLoadingProjects.toString()}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(processarSubmissao)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Placa */}
            <FormField
              control={form.control}
              name="placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ABC1234" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quilometragem */}
            <FormField
              control={form.control}
              name="km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quilometragem Atual</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Combustível */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-14 text-lg border-2 border-gray-200 rounded-md px-4 bg-white focus:border-blue-500 focus:outline-none"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">Selecione o combustível</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Arla">Arla</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantidade */}
            <FormField
              control={form.control}
              name="quantidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade (Litros)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="150.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor por Litro */}
            <FormField
              control={form.control}
              name="valor_litro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Litro (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="6.39" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor Total (somente leitura) */}
            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Projeto - Otimizado para Mobile */}
            <FormField
              control={form.control}
              name="projeto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto *</FormLabel>
                  {isMobile && (
                    <div className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3 flex items-center gap-2">
                      {isLoadingProjects ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-700">Carregando projetos...</span>
                        </>
                      ) : projects.length > 0 ? (
                        <>
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">{projects.length} projetos carregados</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-red-700">Erro no carregamento</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <select
                        className="w-full h-14 text-lg border-2 border-gray-200 rounded-md px-4 bg-white focus:border-blue-500 focus:outline-none"
                        value={selectedProjectId}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log(`[Select-Change] Projeto selecionado: ${value} (isMobile: ${isMobile})`);
                          setSelectedProjectId(value);
                          field.onChange(value);
                        }}
                        disabled={isLoadingProjects}
                      >
                        <option value="">
                          {isLoadingProjects 
                            ? "Carregando..." 
                            : projects.length > 0 
                              ? `Selecione o projeto (${projects.length} disponíveis)` 
                              : "❌ Nenhum projeto carregado"}
                        </option>
                        {projects.length > 0 ? (
                          projects.map((project) => {
                            console.log(`[SELECT-RENDER] Renderizando: ${project.name} (ID: ${project.id})`);
                            return (
                              <option 
                                key={`project-${project.id}`} 
                                value={project.id.toString()}
                              >
                                {project.name}
                              </option>
                            );
                          })
                        ) : (
                          !isLoadingProjects && (
                            <option value="" disabled>❌ Erro: API não retornou projetos</option>
                          )
                        )}
                      </select>
                    </FormControl>
                    {projects.length === 0 && !isLoadingProjects && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoadingProjects(true);
                          try {
                            const response = await fetch(`${window.location.origin}/api/public/projects-with-bases`, {
                              method: 'GET',
                              headers: { 'Accept': 'application/json' },
                              credentials: 'include'
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.data?.length > 0) {
                                setProjects(data.data);
                                console.log(`[Manual-Load] ${data.data.length} projetos carregados`);
                              }
                            }
                          } catch (error) {
                            console.error('[Manual-Load] Erro:', error);
                          } finally {
                            setIsLoadingProjects(false);
                          }
                        }}
                        className="h-14 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
                        disabled={isLoadingProjects}
                      >
                        🔄
                      </button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Base - Otimizado para Mobile */}
            <FormField
              control={form.control}
              name="base_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base *</FormLabel>
                  <FormControl>
                    <select
                      className="w-full h-14 text-lg border-2 border-gray-200 rounded-md px-4 bg-white focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                      value={selectedBaseId}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log(`[Select-Change] Base selecionada: ${value} (isMobile: ${isMobile})`);
                        setSelectedBaseId(value);
                        field.onChange(value);
                      }}
                      disabled={!selectedProjectId || availableBases.length === 0 || isLoadingProjects}
                    >
                      <option value="">
                        {!selectedProjectId 
                          ? "Selecione primeiro um projeto" 
                          : availableBases.length === 0 
                            ? "Nenhuma base disponível" 
                            : "Selecione a base"
                        }
                      </option>
                      {availableBases.map((base: any) => (
                        <option 
                          key={`base-${base.id}`} 
                          value={base.id.toString()}
                        >
                          {base.base_name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Veículo */}
            <FormField
              control={form.control}
              name="tipo_veiculo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Veículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="frota">Frota</SelectItem>
                      <SelectItem value="terceiro">Terceiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome do Motorista */}
            <FormField
              control={form.control}
              name="motorista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Motorista</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* RG do Motorista */}
            <FormField
              control={form.control}
              name="motorista_rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG do Motorista</FormLabel>
                  <FormControl>
                    <Input placeholder="12.345.678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome do Operador */}
            <FormField
              control={form.control}
              name="operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Operador</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do operador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


          </div>

          {/* Botões de ação - Otimizados para Mobile */}
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
            {isMobile && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedProjectId("");
                  setSelectedBaseId("");
                }}
                className="h-12 text-base"
              >
                🔄 Limpar Formulário
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedProjectId || !selectedBaseId}
              className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isMobile ? "Salvando..." : "Registrando..."}
                </>
              ) : (
                isMobile ? "💾 Salvar Abastecimento" : "Registrar Abastecimento"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};