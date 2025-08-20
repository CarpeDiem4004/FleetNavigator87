/**
 * Formulário de Recebimento de Combustível
 * Para registro de entrega de combustível nos tanques dos postos
 */

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { useSafeState } from "@/hooks/useSafeState";
import { supabase } from "@/lib/supabase-compat";
import { useAuth } from "@/context/AuthContext";

// Schema de validação - simplificado para 7 campos para Campinas V2
const recebimentoSchema = z.object({
  tipo_produto: z.string().min(1, "Tipo de produto é obrigatório"),
  litros_recebidos: z.string().min(1, "Quantidade de litros é obrigatória"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  numero_nota_fiscal: z.string().min(1, "Número da nota fiscal é obrigatório"),
  nome_fornecedor: z.string().min(1, "Nome do fornecedor é obrigatório"),
  nome_operador: z.string().min(1, "Nome do operador é obrigatório"),
  observacoes: z.string().optional(),
});

type RecebimentoValues = z.infer<typeof recebimentoSchema>;

interface FormularioRecebimentoProps {
  postId: string;
  onRegistroSucesso?: () => void;
}

export const FormularioRecebimentoCombustivel: React.FC<FormularioRecebimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);

  const form = useForm<RecebimentoValues>({
    resolver: zodResolver(recebimentoSchema),
    defaultValues: {
      tipo_produto: "diesel",
      litros_recebidos: "",
      valor_total: "",
      nome_fornecedor: "",
      numero_nota_fiscal: "",
      nome_operador: "",
      observacoes: "",
    },
  });

  // Preencher automaticamente o nome do operador baseado no usuário logado
  useEffect(() => {
    console.log('[RECEBIMENTO] Verificando usuário para operador:', {
      user: user,
      userName: user?.name,
      userRole: user?.role
    });
    
    const setOperatorName = (name: string) => {
      console.log('[RECEBIMENTO] Definindo nome do operador:', name);
      form.setValue('nome_operador', name, { shouldValidate: true });
    };
    
    if (user?.name && user.name !== "Administrador") {
      setOperatorName(user.name);
    } else if (user?.name === "Administrador") {
      setOperatorName('Operador');
    } else {
      console.log('[RECEBIMENTO] Aguardando carregamento do usuário...');
      // Tentar novamente após um delay
      const timer = setTimeout(() => {
        if (user?.name && user.name !== "Administrador") {
          setOperatorName(user.name);
        } else {
          setOperatorName('Operador');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user?.name, user?.role, form]);

  // Mapa das tabelas por posto
  const tableMap: { [key: string]: string } = {
    'osasco_v2': 'recebimentos_posto_osasco_v2',
    'abc_v2': 'recebimentos_posto_abc_v2',
    'alair_v2': 'recebimentos_posto_alair_v2',
    'campinas_v2': 'recebimentos_posto_campinas_v2',
    'socorro_v2': 'recebimentos_posto_socorro_v2',
    'sorocaba_v2': 'recebimentos_posto_sorocaba_v2',
    'guarulhos_v2': 'recebimentos_posto_guarulhos_v2'
  };

  const handleSubmit = async (data: RecebimentoValues) => {
    try {
      setIsSubmitting(true);
      
      console.log('[RECEBIMENTO] Dados do formulário recebidos:', data);
      console.log('[RECEBIMENTO] Registrando recebimento para posto:', postId);
      console.log('[RECEBIMENTO] Validação de campos:', {
        tipo_produto: data.tipo_produto ? '✓' : '✗ FALTANDO',
        litros_recebidos: data.litros_recebidos ? '✓' : '✗ FALTANDO',
        nome_fornecedor: data.nome_fornecedor ? '✓' : '✗ FALTANDO',
        numero_nota_fiscal: data.numero_nota_fiscal ? '✓' : '✗ FALTANDO',
        nome_operador: data.nome_operador ? '✓' : '✗ FALTANDO',
        valor_total: data.valor_total ? '✓' : '✗ FALTANDO'
      });
      
      // Validar campos obrigatórios (7 campos para Campinas V2)
      if (!data.tipo_produto || !data.litros_recebidos || !data.valor_total || !data.nome_fornecedor || !data.numero_nota_fiscal || !data.nome_operador) {
        console.error('[RECEBIMENTO] Validação falhou - campos obrigatórios faltando');
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }
      
      // Calcular valor por litro automaticamente
      const litros = parseFloat(data.litros_recebidos);
      const valorTotal = parseFloat(data.valor_total);
      const valorLitro = valorTotal / litros;
      
      // Para Campinas V2, usar a API específica de recebimentos
      if (postId === 'campinas_v2') {
        const payload = {
          posto: 'campinas_v2',
          tipo_produto: data.tipo_produto,
          litros_recebidos: data.litros_recebidos,
          valor_total: data.valor_total,
          numero_nota_fiscal: data.numero_nota_fiscal,
          nome_fornecedor: data.nome_fornecedor,
          nome_operador: data.nome_operador,
          observacoes: data.observacoes || ''
        };
        
        console.log('[RECEBIMENTO] Usando API específica para Campinas V2:', payload);
        
        const response = await fetch('/api/recebimentos-externos/campinas-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[RECEBIMENTO] Resultado da API:', result);
        
        if (!result.success) {
          throw new Error(result.message || 'Erro ao registrar recebimento');
        }
        
        setRegistroSucesso(true);
        form.reset({
          tipo_produto: "diesel",
          litros_recebidos: "",
          valor_total: "",
          nome_fornecedor: "",
          numero_nota_fiscal: "",
          nome_operador: "Operador Campinas V2",
          observacoes: "",
        });
        
        toast({
          title: "Sucesso!",
          description: "Recebimento de combustível registrado com sucesso!",
        });
        
        if (onRegistroSucesso) onRegistroSucesso();
        return;
      }
      
      // Para outros postos, usar o código original
      const payload = {
        fornecedor: data.nome_fornecedor,
        tipo_combustivel: data.tipo_produto,
        quantidade_litros: parseFloat(data.litros_recebidos),
        valor_litro: valorLitro,
        valor_total: parseFloat(data.valor_total),
        numero_nota: data.numero_nota_fiscal,
        data_entrega: new Date().toISOString().split('T')[0],
        nome_operador: data.nome_operador,
        observacoes: data.observacoes || ''
      };
      
      console.log('[RECEBIMENTO] Payload para API:', payload);
      console.log('[RECEBIMENTO] Tipos dos campos:', {
        fornecedor: typeof payload.fornecedor,
        tipo_combustivel: typeof payload.tipo_combustivel,
        quantidade_litros: typeof payload.quantidade_litros,
        valor_litro: typeof payload.valor_litro,
        valor_total: typeof payload.valor_total,
        numero_nota: typeof payload.numero_nota,
        data_entrega: typeof payload.data_entrega,
        nome_operador: typeof payload.nome_operador,
        observacoes: typeof payload.observacoes
      });
      
      const response = await fetch(`/api/recebimentos/${postId.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      console.log('[RECEBIMENTO] Resposta da API:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao registrar recebimento');
      }

      console.log('[RECEBIMENTO] Registrado com sucesso:', result.data);

      // Resetar formulário
      form.reset();
      
      // Mostrar sucesso
      setRegistroSucesso(true);
      
      toast({
        title: "Recebimento Registrado",
        description: `Recebimento de ${data.litros_recebidos}L de ${data.tipo_produto} registrado com sucesso!`,
        duration: 5000,
      });

      // Callback de sucesso
      if (onRegistroSucesso) {
        onRegistroSucesso();
      }

      // Limpar flag de sucesso após 3 segundos
      setTimeout(() => {
        setRegistroSucesso(false);
      }, 3000);

    } catch (error: any) {
      console.error('[RECEBIMENTO] Erro ao registrar:', error);
      
      toast({
        title: "Erro ao Registrar Recebimento",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularValorTotal = () => {
    const litros = parseFloat(form.watch("litros_recebidos") || "0");
    const valorTotal = parseFloat(form.watch("valor_total") || "0");
    return !isNaN(valorTotal) && litros > 0 ? (valorTotal / litros).toFixed(4) : "";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Recebimento de Combustível no Tanque
        </h2>
        <p className="text-gray-600 mt-2">
          Registre o recebimento de combustível no tanque do posto {postId.replace('_v2', '').toUpperCase()}_V2
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Produto Recebido */}
            <FormField
              control={form.control}
              name="tipo_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Produto Recebido</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {postId === 'campinas_v2' ? (
                        <>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="arla32">Arla 32</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="gasolina_comum">Gasolina Comum</SelectItem>
                          <SelectItem value="gasolina_aditivada">Gasolina Aditivada</SelectItem>
                          <SelectItem value="etanol">Etanol</SelectItem>
                          <SelectItem value="arla32">Arla 32</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantidade Recebida (Litros) */}
            <FormField
              control={form.control}
              name="litros_recebidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade Recebida (Litros)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor Total (R$) */}
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
                      placeholder="Ex: 5500.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número da Nota Fiscal */}
            <FormField
              control={form.control}
              name="numero_nota_fiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Nota Fiscal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: NF123456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Fornecedor */}
            <FormField
              control={form.control}
              name="nome_fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Fornecedor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Petrobras, Shell, etc"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome do Operador */}
            <FormField
              control={form.control}
              name="nome_operador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Operador</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome do operador responsável"
                      readOnly
                      className="min-h-[44px] bg-blue-50"
                    />
                  </FormControl>
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
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais sobre o recebimento..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botão de Submit */}
          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || registroSucesso}
              className="min-w-[200px]"
              size="lg"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {registroSucesso && <Check className="mr-2 h-4 w-4" />}
              {registroSucesso 
                ? "Registrado com Sucesso!" 
                : isSubmitting 
                ? "Registrando..." 
                : "Registrar Recebimento no Tanque"
              }
            </Button>
          </div>
          
          {/* Nota sobre data e hora automáticas */}
          <div className="text-center text-sm text-gray-500 mt-4">
            📅 Data e hora serão registradas automaticamente.
          </div>
        </form>
      </Form>
    </div>
  );
};

export default FormularioRecebimentoCombustivel;