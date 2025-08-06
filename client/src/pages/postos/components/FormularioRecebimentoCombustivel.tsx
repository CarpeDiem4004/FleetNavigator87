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

// Schema de validação atualizado para incluir todos os campos
const recebimentoSchema = z.object({
  tipo_produto: z.string().min(1, "Tipo de produto é obrigatório"),
  litros_recebidos: z.string().min(1, "Quantidade de litros é obrigatória"),
  valor_litro: z.string().min(1, "Valor por litro é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  nome_fornecedor: z.string().min(1, "Nome do fornecedor é obrigatório"),
  numero_nota_fiscal: z.string().min(1, "Número da nota fiscal é obrigatório"),
  data_recebimento: z.string().min(1, "Data de recebimento é obrigatória"),
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
      valor_litro: "",
      valor_total: "",
      nome_fornecedor: "",
      numero_nota_fiscal: "",
      data_recebimento: new Date().toISOString().split('T')[0],
      nome_operador: "",
      observacoes: "",
    },
  });

  // Preencher automaticamente o nome do operador quando o usuário está logado
  useEffect(() => {
    if (user?.name) {
      console.log('[RECEBIMENTO] Preenchendo nome do operador automaticamente:', user.name);
      form.setValue('nome_operador', user.name);
    }
  }, [user, form]);

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
        valor_litro: data.valor_litro ? '✓' : '✗ FALTANDO',
        nome_fornecedor: data.nome_fornecedor ? '✓' : '✗ FALTANDO',
        numero_nota_fiscal: data.numero_nota_fiscal ? '✓' : '✗ FALTANDO',
        data_recebimento: data.data_recebimento ? '✓' : '✗ FALTANDO',
        nome_operador: data.nome_operador ? '✓' : '✗ FALTANDO',
        valor_total: data.valor_total ? '✓' : '✗ FALTANDO'
      });
      
      // Validar campos obrigatórios
      if (!data.tipo_produto || !data.litros_recebidos || !data.valor_litro || !data.nome_fornecedor || !data.numero_nota_fiscal || !data.data_recebimento) {
        console.error('[RECEBIMENTO] Validação falhou - campos obrigatórios faltando');
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }
      
      // Usar API do Node.js em vez do Supabase direto
      const payload = {
        fornecedor: data.nome_fornecedor,
        tipo_combustivel: data.tipo_produto,
        quantidade_litros: parseFloat(data.litros_recebidos),
        valor_litro: parseFloat(data.valor_litro),
        valor_total: parseFloat(data.valor_total),
        numero_nota: data.numero_nota_fiscal,
        data_entrega: data.data_recebimento,
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
    const valorLitro = parseFloat(form.watch("valor_litro") || "0");
    return !isNaN(valorLitro) && litros > 0 ? (valorLitro * litros).toFixed(2) : "";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Recebimento de Combustível no Tanque
        </h2>
        <p className="text-gray-600 mt-2">
          Registre a entrega de combustível no posto {postId.replace('_v2', '').toUpperCase()}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Produto */}
            <FormField
              control={form.control}
              name="tipo_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="gasolina_comum">Gasolina Comum</SelectItem>
                      <SelectItem value="gasolina_aditivada">Gasolina Aditivada</SelectItem>
                      <SelectItem value="etanol">Etanol</SelectItem>
                      <SelectItem value="arla32">Arla 32</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Litros Recebidos */}
            <FormField
              control={form.control}
              name="litros_recebidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Litros Recebidos</FormLabel>
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
                      step="0.001"
                      placeholder="Ex: 5.00"
                      {...field}
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
                      placeholder="Ex: 25000.00"
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
                      placeholder="Ex: Petrobras Distribuidora"
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
                      placeholder="Ex: 123456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Recebimento */}
            <FormField
              control={form.control}
              name="data_recebimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Recebimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
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
                      placeholder="Preenchido automaticamente"
                      {...field}
                      readOnly
                      className="bg-gray-50"
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
                : "Registrar Recebimento"
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default FormularioRecebimentoCombustivel;