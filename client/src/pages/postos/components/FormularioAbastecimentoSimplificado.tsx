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
  
  // Estados para projeto e base
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");

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

  // Carregar projetos com bases
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/projects-with-bases', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProjects(data.data || []);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar projetos:', error);
      }
    };

    fetchProjects();
  }, []);

  // Obter projeto selecionado
  const selectedProject = projects.find((p: any) => p.id.toString() === selectedProjectId);
  const availableBases = selectedProject?.bases || [];

  // Atualizar projeto no formulário quando selecionado
  useEffect(() => {
    if (selectedProjectId) {
      form.setValue("projeto_id", selectedProjectId);
      const project = projects.find((p: any) => p.id.toString() === selectedProjectId);
      if (project) {
        form.setValue("projeto", project.name);
      }
      // Reset base quando projeto muda
      setSelectedBaseId("");
      form.setValue("base_id", "");
    }
  }, [selectedProjectId, projects, form]);

  // Atualizar base no formulário quando selecionada
  useEffect(() => {
    if (selectedBaseId) {
      form.setValue("base_id", selectedBaseId);
    }
  }, [selectedBaseId, form]);

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

      // Usar a nova rota unificada
      const endpoint = `/api/abastecimento/${postId.toLowerCase()}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(dadosEnvio),
      });

      const resultado = await response.json();

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

            {/* Seleção de Projeto */}
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        <SelectValue placeholder="Selecione a base" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBases.map((base: any) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
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

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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