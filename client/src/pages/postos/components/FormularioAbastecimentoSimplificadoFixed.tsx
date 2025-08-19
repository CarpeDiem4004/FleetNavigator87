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
import { fixOperatorName } from "@/utils/operatorUtils";
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

export const FormularioAbastecimento: React.FC<FormularioAbastecimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);
  const processingRef = useRef(false);
  
  // Estados para projeto e base - VERSÃO SIMPLIFICADA
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fixar nome do operador baseado no usuário logado
  useEffect(() => {
    const setOperatorName = async () => {
      const operatorName = await fixOperatorName(
        postId, 
        undefined, // sem user context neste componente 
        (field, value) => form.setValue(field, value)
      );
      
      if (operatorName) {
        console.log(`[OPERADOR-FIXACAO] Campo operador fixado: ${operatorName}`);
      }
    };

    setOperatorName();
  }, [postId, form]);

  // Carregar projetos - VERSÃO SIMPLIFICADA E CORRIGIDA
  useEffect(() => {
    const fetchProjects = async () => {
      console.log('[FIXED] Iniciando carregamento de projetos...');
      setIsLoadingProjects(true);
      
      try {
        const response = await fetch('/api/public/projects-with-bases', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('[FIXED] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[FIXED] Data received:', data);
          
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setProjects(data.data);
            console.log(`[FIXED] ✅ ${data.data.length} projetos carregados com sucesso`);
          } else {
            console.error('[FIXED] ❌ Dados inválidos recebidos:', data);
            setProjects([]);
          }
        } else {
          const errorText = await response.text();
          console.error(`[FIXED] ❌ Erro HTTP ${response.status}:`, errorText);
          setProjects([]);
        }
      } catch (error) {
        console.error('[FIXED] ❌ Erro na requisição:', error);
        setProjects([]);
      } finally {
        setIsLoadingProjects(false);
        console.log('[FIXED] Carregamento finalizado');
      }
    };

    fetchProjects();
  }, []);

  // Calcular valor total automaticamente
  const quantidade = form.watch("quantidade");
  const valorLitro = form.watch("valor_litro");

  useEffect(() => {
    if (quantidade && valorLitro) {
      const total = (parseFloat(quantidade) * parseFloat(valorLitro)).toFixed(2);
      form.setValue("valor_total", total);
    }
  }, [quantidade, valorLitro, form]);

  // Obter projeto selecionado
  const selectedProject = projects.find((p: any) => p.id.toString() === selectedProjectId);
  const availableBases = selectedProject?.bases || [];

  // Atualizar projeto no formulário
  useEffect(() => {
    if (selectedProjectId) {
      form.setValue("projeto_id", selectedProjectId);
      const project = projects.find((p: any) => p.id.toString() === selectedProjectId);
      if (project) {
        form.setValue("projeto", project.name);
      }
    }
  }, [selectedProjectId, projects, form]);

  // Atualizar base no formulário
  useEffect(() => {
    if (selectedBaseId) {
      form.setValue("base_id", selectedBaseId);
    }
  }, [selectedBaseId, form]);

  // Resetar base quando projeto mudar
  useEffect(() => {
    setSelectedBaseId("");
    form.setValue("base_id", "");
  }, [selectedProjectId, form]);

  // Processar submissão
  const processarSubmissao = async (data: AbastecimentoValues) => {
    if (processingRef.current || isSubmitting) return;
    
    processingRef.current = true;
    setIsSubmitting(true);

    try {
      const endpoint = `/api/abastecimento-unificado/${postId}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const resultado = await response.json();

      if (response.ok && resultado.success) {
        setRegistroSucesso(true);
        
        toast({
          title: "Abastecimento registrado!",
          description: `Abastecimento de ${data.quantidade}L registrado com sucesso.`,
        });

        form.reset();
        
        if (onRegistroSucesso) {
          onRegistroSucesso();
        }
      } else {
        throw new Error(resultado.message || "Erro ao registrar abastecimento");
      }

    } catch (error) {
      console.error('[FIXED] Erro ao registrar:', error);
      
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
          onClick={() => setRegistroSucesso(false)}
          className="bg-green-600 hover:bg-green-700"
        >
          Registrar Novo Abastecimento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
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
                    <Input type="number" step="0.01" placeholder="50.00" {...field} />
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
                    <Input type="number" step="0.001" placeholder="6.390" {...field} />
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
                    <Input {...field} readOnly className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seleção de Projeto - VERSÃO CORRIGIDA */}
            <FormField
              control={form.control}
              name="projeto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto *</FormLabel>
                  <Select 
                    value={selectedProjectId} 
                    onValueChange={(value) => {
                      setSelectedProjectId(value);
                      field.onChange(value);
                    }}
                    disabled={isLoadingProjects}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            isLoadingProjects 
                              ? "Carregando projetos..." 
                              : projects.length === 0 
                                ? "Nenhum projeto disponível" 
                                : "Selecione o projeto"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem 
                          key={`project-${project.id}`} 
                          value={project.id.toString()}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {isLoadingProjects && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando projetos...
                    </div>
                  )}
                  {!isLoadingProjects && projects.length === 0 && (
                    <div className="text-sm text-red-500">
                      Erro: Nenhum projeto encontrado. Verifique sua conexão.
                    </div>
                  )}
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
                  <Select 
                    value={selectedBaseId} 
                    onValueChange={(value) => {
                      setSelectedBaseId(value);
                      field.onChange(value);
                    }}
                    disabled={!selectedProjectId || availableBases.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                    <SelectContent>
                      {availableBases.map((base: any) => (
                        <SelectItem 
                          key={`base-${base.id}`} 
                          value={base.id.toString()}
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

            {/* Motorista */}
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

            {/* Operador - FIXADO */}
            <FormField
              control={form.control}
              name="operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operador do Posto *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="Nome do operador"
                      className="bg-gray-50 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500 mt-1">
                    Preenchido automaticamente com o operador logado
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Observações */}
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Observações adicionais..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Abastecimento"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};