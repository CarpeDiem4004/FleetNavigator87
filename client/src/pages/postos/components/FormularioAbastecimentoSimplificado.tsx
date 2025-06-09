/**
 * Formulário de Abastecimento Simplificado
 * Usa a nova rota unificada que resolve automaticamente problemas de schema
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
  observacoes: z.string().optional(),
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
  const processingRef = useRef(false);
  
  // Estados para projeto e base com debouncing para mobile
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      observacoes: "",
    },
  });

  // Detectar dispositivo móvel e carregar operador
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [form]);

  // Carregar projetos com bases (otimizado com cache e diagnóstico detalhado)
  useEffect(() => {
    const fetchProjects = async () => {
      if (isLoadingProjects) return;
      
      const startTime = performance.now();
      console.log('[PERF] 🚀 Iniciando carregamento de projetos...');
      console.log('[PERF] 📱 User Agent:', navigator.userAgent);
      console.log('[PERF] 🌐 Connection:', (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : 'Não disponível');
      
      // Verificar cache primeiro
      const cacheKey = 'projects_with_bases_cache';
      const cacheTimeKey = 'projects_cache_time';
      const cacheExpiry = 5 * 60 * 1000; // 5 minutos
      
      const cacheStart = performance.now();
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      const cacheCheckTime = performance.now() - cacheStart;
      console.log(`[PERF] 💾 Verificação cache: ${cacheCheckTime.toFixed(2)}ms`);
      
      if (cachedData && cacheTime) {
        const isExpired = Date.now() - parseInt(cacheTime) > cacheExpiry;
        if (!isExpired) {
          const parseStart = performance.now();
          const parsedData = JSON.parse(cachedData);
          const parseTime = performance.now() - parseStart;
          
          console.log(`[PERF] 🔄 Parse cache: ${parseTime.toFixed(2)}ms`);
          console.log(`[PERF] ✅ Total com cache: ${(performance.now() - startTime).toFixed(2)}ms`);
          console.log('[CACHE] 📦 Carregando projetos do cache');
          
          setProjects(parsedData);
          return;
        } else {
          console.log('[CACHE] ⏰ Cache expirado, fazendo nova requisição');
        }
      } else {
        console.log('[CACHE] 🔍 Nenhum cache encontrado');
      }
      
      setIsLoadingProjects(true);
      
      try {
        const fetchStart = performance.now();
        console.log('[NET] 🌐 Iniciando requisição HTTP...');
        console.log('[NET] 🎯 URL:', '/api/public/projects-with-bases');
        
        const response = await fetch('/api/public/projects-with-bases', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Priority': 'u=1, i',
          },
          credentials: 'include',
          signal: AbortSignal.timeout(15000),
        });
        
        const fetchTime = performance.now() - fetchStart;
        console.log(`[NET] ⏱️ Tempo de rede: ${fetchTime.toFixed(2)}ms`);
        console.log(`[NET] 📊 Status: ${response.status}`);
        console.log(`[NET] 📝 Headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const parseStart = performance.now();
          const data = await response.json();
          const parseTime = performance.now() - parseStart;
          console.log(`[NET] 🔧 Parse JSON: ${parseTime.toFixed(2)}ms`);
          console.log(`[NET] 📋 Dados recebidos:`, {
            success: data.success,
            dataLength: data.data ? data.data.length : 0,
            dataSize: JSON.stringify(data).length + ' bytes'
          });
          
          if (data.success && data.data) {
            const setStateStart = performance.now();
            setProjects(data.data);
            const setStateTime = performance.now() - setStateStart;
            
            // Salvar no cache
            const cacheStart = performance.now();
            localStorage.setItem(cacheKey, JSON.stringify(data.data));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
            const cacheTime = performance.now() - cacheStart;
            
            const totalTime = performance.now() - startTime;
            
            console.log(`[PERF] 🎨 setState: ${setStateTime.toFixed(2)}ms`);
            console.log(`[PERF] 💾 Salvar cache: ${cacheTime.toFixed(2)}ms`);
            console.log(`[PERF] 🏁 TOTAL: ${totalTime.toFixed(2)}ms`);
            console.log(`[API] ✅ Projetos carregados: ${data.data.length}`);
            
            // Análise de performance para mobile
            if (totalTime > 2000) {
              console.warn(`[PERF] ⚠️ LENTO! ${totalTime.toFixed(2)}ms > 2000ms`);
              if (fetchTime > 1500) {
                console.warn('[PERF] 🐌 Problema de REDE detectado');
              }
              if (parseTime > 300) {
                console.warn('[PERF] 🐌 Problema de PARSE detectado');
              }
            }
          } else {
            console.error('[API] ❌ Resposta inválida:', data);
          }
        } else {
          const errorText = await response.text();
          console.error(`[NET] ❌ HTTP Error: ${response.status}`);
          console.error(`[NET] 📄 Error body:`, errorText);
          console.error('[CRITICAL] Não foi possível carregar projetos!');
          // NÃO usar fallback - deixar vazio para forçar correção
          setProjects([]);
        }
      } catch (error) {
        const totalTime = performance.now() - startTime;
        console.error(`[ERROR] 💥 Erro após ${totalTime.toFixed(2)}ms:`, error);
        console.error('[ERROR] 📚 Stack:', error.stack);
        console.error('[ERROR] 🔍 Tipo:', error.name);
        console.error('[ERROR] 💬 Mensagem:', error.message);
        console.warn('[FALLBACK] 🔄 Usando configuração mínima');
        setProjects([
          { id: 1, name: "Operação Principal", bases: [{ id: 1, base_name: "Base Principal" }] }
        ]);
      } finally {
        const finalTime = performance.now() - startTime;
        console.log(`[PERF] 🎬 FINAL: ${finalTime.toFixed(2)}ms`);
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

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
        tipo_veiculo: data.tipo_veiculo,
        observacoes: data.observacoes || null,
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
        observacoes: dadosEnvio.observacoes,
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

  return (
    <div className="space-y-6">
      {/* Indicador para Mobile */}
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          📱 Modo Mobile Ativado - Interface otimizada para seu dispositivo
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o combustível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Arla">Arla</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={selectedProjectId} 
                    onValueChange={(value) => {
                      if (isMobile) {
                        // Para mobile, usar timeout para evitar travamentos
                        setTimeout(() => {
                          setSelectedProjectId(value);
                          field.onChange(value);
                        }, 100);
                      } else {
                        setSelectedProjectId(value);
                        field.onChange(value);
                      }
                    }}
                    disabled={isLoadingProjects}
                  >
                    <FormControl>
                      <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                        <SelectValue placeholder={isLoadingProjects ? "Carregando..." : "Selecione o projeto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      className={isMobile ? "max-h-48 overflow-y-auto" : ""}
                      position={isMobile ? "popper" : "item-aligned"}
                      sideOffset={isMobile ? 8 : 4}
                    >
                      {projects.map((project) => (
                        <SelectItem 
                          key={`project-${project.id}`} 
                          value={project.id.toString()}
                          className={isMobile ? "h-12 text-base" : ""}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={selectedBaseId} 
                    onValueChange={(value) => {
                      if (isMobile) {
                        // Para mobile, usar timeout para evitar travamentos
                        setTimeout(() => {
                          setSelectedBaseId(value);
                          field.onChange(value);
                        }, 100);
                      } else {
                        setSelectedBaseId(value);
                        field.onChange(value);
                      }
                    }}
                    disabled={!selectedProjectId || availableBases.length === 0 || isLoadingProjects}
                  >
                    <FormControl>
                      <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                        <SelectValue 
                          placeholder={
                            !selectedProjectId 
                              ? "Selecione primeiro um projeto" 
                              : availableBases.length === 0 
                                ? "Nenhuma base disponível" 
                                : "Selecione a base"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      className={isMobile ? "max-h-48 overflow-y-auto" : ""}
                      position={isMobile ? "popper" : "item-aligned"}
                      sideOffset={isMobile ? 8 : 4}
                    >
                      {availableBases.map((base: any) => (
                        <SelectItem 
                          key={`base-${base.id}`} 
                          value={base.id.toString()}
                          className={isMobile ? "h-12 text-base" : ""}
                        >
                          {base.base_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Observações adicionais..." {...field} />
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