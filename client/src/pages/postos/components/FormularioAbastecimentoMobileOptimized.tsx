/**
 * Formulário de Abastecimento Otimizado para Mobile - VERSÃO CORRIGIDA
 * Soluções implementadas:
 * - Correção de timezone para postos externos
 * - Campos Select otimizados para touch em dispositivos móveis
 * - Debouncing para melhor performance mobile
 * - Validação aprimorada de dados
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
import { Loader2, Check, Smartphone } from "lucide-react";
import { useSafeState } from "@/hooks/useSafeState";

// Schema de validação
const abastecimentoSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória").max(8, "Placa deve ter no máximo 8 caracteres"),
  km: z.string().min(1, "Quilometragem é obrigatória"),
  tipo: z.string().min(1, "Tipo de combustível é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_litro: z.string().min(1, "Valor por litro é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  projeto: z.string().optional(),
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

export const FormularioAbastecimentoMobileOptimized: React.FC<FormularioAbastecimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);
  
  // Mobile detection com melhor detecção
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const processingRef = useRef(false);
  
  // Estados para projeto e base com debouncing otimizado para mobile
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: "",
      km: "",
      tipo: "",
      quantidade: "",
      valor_litro: "6.39",
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

  // Carregar operador automaticamente
  useEffect(() => {
    const operadorSalvo = localStorage.getItem('operador_atual');
    if (operadorSalvo) {
      form.setValue("operador", operadorSalvo);
    }
  }, [form]);

  // Buscar projetos e bases disponíveis com otimização mobile
  useEffect(() => {
    const fetchProjects = async () => {
      if (isLoadingProjects) return;
      
      setIsLoadingProjects(true);
      
      try {
        console.log(`[FormularioMobile] Buscando projetos para posto: ${postId}`);
        
        const response = await fetch(`/api/postos/${postId}/projects`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': navigator.userAgent,
            'X-Mobile-Device': isMobile ? 'true' : 'false'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[FormularioMobile] Projetos recebidos:`, data);
          
          if (Array.isArray(data) && data.length > 0) {
            setProjects(data);
          } else {
            console.warn('[FormularioMobile] Nenhum projeto encontrado');
            setProjects([]);
          }
        } else {
          console.error('[FormularioMobile] Erro ao buscar projetos:', response.status);
          setProjects([]);
        }
      } catch (error) {
        console.error('[FormularioMobile] Erro na requisição:', error);
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [postId, isLoadingProjects, isMobile]);

  // Obter projeto selecionado
  const selectedProject = projects.find((p: any) => p.id.toString() === selectedProjectId);
  const availableBases = selectedProject?.bases || [];

  // Atualizar projeto no formulário com debounce otimizado para mobile
  useEffect(() => {
    if (!selectedProjectId) return;

    const timeoutId = setTimeout(() => {
      form.setValue("projeto_id", selectedProjectId);
      const project = projects.find((p: any) => p.id.toString() === selectedProjectId);
      if (project) {
        form.setValue("projeto", project.name);
      }
      if (selectedBaseId) {
        setSelectedBaseId("");
        form.setValue("base_id", "");
      }
    }, isMobile ? 500 : 200); // Maior delay em mobile para evitar múltiplas chamadas

    return () => clearTimeout(timeoutId);
  }, [selectedProjectId, projects, selectedBaseId, form, isMobile]);

  // Atualizar base no formulário com debounce
  useEffect(() => {
    if (!selectedBaseId) return;

    const timeoutId = setTimeout(() => {
      form.setValue("base_id", selectedBaseId);
    }, isMobile ? 300 : 100);

    return () => clearTimeout(timeoutId);
  }, [selectedBaseId, form, isMobile]);

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
      console.log(`[FormularioMobile] Registrando para posto: ${postId}`);
      console.log(`[FormularioMobile] Dados:`, data);

      // Preparar dados para envio com correção de timezone
      const selectedProject = projects.find((p: any) => p.id.toString() === data.projeto_id);
      const selectedBase = selectedProject?.bases.find((b: any) => b.id.toString() === data.base_id);
      
      // Aplicar correção de timezone para postos externos
      const currentTime = new Date();
      const isExternalStation = ['abc_v2', 'osasco_v2', 'campinas_v2'].includes(postId);
      
      const dadosEnvio = {
        placa: data.placa.toUpperCase().trim(),
        km: Number(data.km),
        tipo_combustivel: data.tipo,
        quantidade: Number(data.quantidade),
        valor_litro: Number(data.valor_litro),
        valor_total: Number(data.valor_total),
        projeto: selectedProject?.name || data.projeto || "NÃO ESPECIFICADO",
        projeto_id: data.projeto_id,
        base_id: data.base_id,
        base: selectedBase?.name || "NÃO ESPECIFICADO",
        motorista: data.motorista.trim(),
        motorista_rg: data.motorista_rg.trim(),
        operador: data.operador.trim(),
        tipo_veiculo: data.tipo_veiculo,
        observacoes: data.observacoes || null,
        // Metadados para correção de timezone
        is_mobile_device: isMobile,
        is_external_station: isExternalStation,
        timezone_offset: currentTime.getTimezoneOffset(),
        user_agent: navigator.userAgent
      };

      console.log(`[FormularioMobile] Enviando dados com correção de timezone:`, dadosEnvio);

      const response = await fetch(`/api/postos/${postId}/abastecimentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mobile-Device': isMobile ? 'true' : 'false',
          'X-Timezone-Correction': isExternalStation ? 'required' : 'none'
        },
        credentials: 'include',
        body: JSON.stringify(dadosEnvio),
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('[FormularioMobile] Registro salvo com sucesso:', resultado);
        
        // Salvar operador para próximas utilizações
        localStorage.setItem('operador_atual', data.operador);
        
        setRegistroSucesso(true);
        
        toast({
          title: "✅ Registro Salvo!",
          description: `Abastecimento de ${data.quantidade}L registrado com sucesso${isExternalStation ? ' (timezone corrigido)' : ''}.`,
          duration: 3000,
        });

        if (onRegistroSucesso) {
          onRegistroSucesso();
        }
      } else {
        const errorData = await response.json();
        console.error('[FormularioMobile] Erro no servidor:', errorData);
        
        toast({
          title: "❌ Erro ao Salvar",
          description: errorData.message || "Erro interno do servidor. Tente novamente.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('[FormularioMobile] Erro na requisição:', error);
      
      toast({
        title: "❌ Erro de Conexão",
        description: "Falha na comunicação com o servidor. Verifique sua conexão.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      processingRef.current = false;
    }
  };

  if (registroSucesso) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Abastecimento Registrado!
        </h3>
        <p className="text-green-600 text-center mb-4">
          O registro foi salvo com sucesso no sistema{isMobile ? ' (mobile)' : ''}.
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Modo Mobile Ativado - Interface otimizada para touch
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
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
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
                    <Input 
                      type="number" 
                      placeholder="150000" 
                      {...field}
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Combustível - Otimizado para Mobile */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className={isMobile ? "min-h-[48px] text-base" : ""}
                        style={{ 
                          fontSize: isMobile ? '16px' : 'inherit',
                          touchAction: 'manipulation'
                        }}
                      >
                        <SelectValue placeholder="Selecione o combustível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      className={isMobile ? "max-h-[60vh]" : ""}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <SelectItem 
                        value="Diesel" 
                        className={isMobile ? "min-h-[44px] text-base" : ""}
                      >
                        Diesel
                      </SelectItem>
                      <SelectItem 
                        value="Arla" 
                        className={isMobile ? "min-h-[44px] text-base" : ""}
                      >
                        Arla
                      </SelectItem>
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="150.50" 
                      {...field}
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                    />
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="6.39" 
                      {...field}
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor Total */}
            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="962.85" 
                      {...field} 
                      readOnly
                      className="bg-gray-50"
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seção de Projeto e Base - Otimizada para Mobile */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-blue-800">Seleção de Projeto e Base</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Projeto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Projeto</label>
                {isLoadingProjects ? (
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando projetos...</span>
                  </div>
                ) : (
                  <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
                    <SelectTrigger 
                      className={isMobile ? "min-h-[48px] text-base" : ""}
                      style={{ 
                        fontSize: isMobile ? '16px' : 'inherit',
                        touchAction: 'manipulation'
                      }}
                    >
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent 
                      className={isMobile ? "max-h-[60vh]" : ""}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {projects.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id.toString()}
                          className={isMobile ? "min-h-[44px] text-base" : ""}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Base */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Base</label>
                <Select 
                  onValueChange={setSelectedBaseId} 
                  value={selectedBaseId}
                  disabled={!selectedProjectId || availableBases.length === 0}
                >
                  <SelectTrigger 
                    className={isMobile ? "min-h-[48px] text-base" : ""}
                    style={{ 
                      fontSize: isMobile ? '16px' : 'inherit',
                      touchAction: 'manipulation'
                    }}
                  >
                    <SelectValue placeholder="Selecione uma base" />
                  </SelectTrigger>
                  <SelectContent 
                    className={isMobile ? "max-h-[60vh]" : ""}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {availableBases.map((base: any) => (
                      <SelectItem 
                        key={base.id} 
                        value={base.id.toString()}
                        className={isMobile ? "min-h-[44px] text-base" : ""}
                      >
                        {base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dados do Motorista */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="motorista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Motorista</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome completo" 
                      {...field}
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
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
                  <FormLabel>RG do Motorista</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12.345.678-9" 
                      {...field}
                      style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Operador */}
          <FormField
            control={form.control}
            name="operador"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Operador</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome do operador responsável" 
                    {...field}
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                  />
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
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Informações adicionais..." 
                    {...field}
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botão de Envio */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
            style={{ minHeight: isMobile ? '48px' : 'auto' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              `Registrar Abastecimento${isMobile ? ' (Mobile)' : ''}`
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};