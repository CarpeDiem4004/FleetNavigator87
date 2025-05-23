import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, Fuel } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSafeState } from "@/hooks/useSafeState"; // 👈 Importando o novo hook
import eventosBus, { EVENTOS } from "@/lib/eventosBus";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Importando o cliente Supabase para buscar os postos
import { supabase } from "@/lib/supabase-client";
import { enviarAbastecimentoSupabase } from "@/utils/supabase-sync";
// Importando o componente de seleção de projetos padronizados
import SeletorProjetos from "@/components/projetos/SeletorProjetos";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Schema de validação
const abastecimentoSchema = z.object({
  placa: z.string().min(7, "A placa deve ter no mínimo 7 caracteres"),
  km: z.string().min(1, "O KM é obrigatório"),
  tipo: z.string({
    required_error: "Selecione o tipo de combustível",
  }),
  quantidade: z.string().min(1, {
    message: "Quantidade deve ser um número válido",
  }),
  valor_litro: z.string().min(1, "O valor por litro é obrigatório"),
  valor_total: z.string().optional(),
  projeto: z.string().min(2, "O projeto é obrigatório"),
  motorista: z
    .string()
    .min(3, "O nome do motorista deve ter no mínimo 3 caracteres"),
  motorista_rg: z.string().min(5, "O RG do motorista é obrigatório"),
  operador: z
    .string()
    .min(3, "O nome do operador deve ter no mínimo 3 caracteres"),
  tipo_veiculo: z.string().default("frota"),
  data_registro: z.date().optional(),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;

interface FormularioAbastecimentoProps {
  postId: string;
  onRegistroSucesso?: () => void;
}

// Componente Form separado para evitar re-renders múltiplos do mesmo form
const FormularioForm = ({
  onSubmit,
  isSubmitting,
  postId,
  isAdmin = false,
  dieselValorLitro = "0",
  arlaValorLitro = "0",
}: {
  onSubmit: (data: AbastecimentoValues) => void;
  isSubmitting: boolean;
  postId: string;
  isAdmin?: boolean;
  dieselValorLitro?: string;
  arlaValorLitro?: string;
}) => {
  // Obter nome do operador logado do localStorage (adicionado pelo sistema de autenticação)
  const operadorNome = localStorage.getItem("user_name") || "";
  const [quantidade, setQuantidade] = useState("");
  const [tipoCombustivel, setTipoCombustivel] = useState("");
  const [valorLitro, setValorLitro] = useState("");
  const [valorTotal, setValorTotal] = useState("0");

  // Formulário sempre instanciado uma única vez
  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: "",
      km: "",
      tipo: "",
      quantidade: "",
      valor_litro: "",
      valor_total: "0",
      projeto: "",
      motorista: "",
      motorista_rg: "",
      operador: operadorNome, // Preenche automaticamente com o nome do operador logado
      tipo_veiculo: "frota",
    },
  });

  // Quando o tipo de combustível muda, atualize o valor por litro
  useEffect(() => {
    if (tipoCombustivel === "Diesel") {
      setValorLitro(dieselValorLitro);
      form.setValue("valor_litro", dieselValorLitro);
    } else if (tipoCombustivel === "ARLA") {
      setValorLitro(arlaValorLitro);
      form.setValue("valor_litro", arlaValorLitro);
    }
  }, [tipoCombustivel, dieselValorLitro, arlaValorLitro, form]);

  // Calcular valor total quando a quantidade ou valor por litro muda
  useEffect(() => {
    if (quantidade && valorLitro) {
      const total = (parseFloat(quantidade) * parseFloat(valorLitro)).toFixed(
        2,
      );
      setValorTotal(total);
      form.setValue("valor_total", total);
    } else {
      setValorTotal("0");
      form.setValue("valor_total", "0");
    }
  }, [quantidade, valorLitro, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Formulário otimizado para dispositivos móveis */}
        <div className="grid grid-cols-1 gap-4">
          {/* Seção de identificação do veículo */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg mb-2">
            <h3 className="text-md font-semibold mb-3">
              Informações do Veículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="uppercase text-lg font-medium"
                        style={{ height: "48px" }}
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
                    <FormLabel>KM Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="123456"
                        {...field}
                        className="text-lg font-medium"
                        style={{ height: "48px" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="tipo_veiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Veículo</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-lg font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value="frota">Frota</option>
                        <option value="agregado">Agregado</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção de abastecimento */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg mb-2">
            <h3 className="text-md font-semibold mb-3">
              Dados do Abastecimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Combustível</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-lg font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setTipoCombustivel(e.target.value);
                        }}
                        onBlur={field.onBlur}
                      >
                        <option value="">Selecione o combustível</option>
                        <option value="Diesel">Diesel</option>
                        <option value="ARLA">ARLA</option>
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
                    <FormLabel>Quantidade (Litros)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="decimal"
                        placeholder="100"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setQuantidade(e.target.value);
                        }}
                        className="text-lg font-medium"
                        style={{ height: "48px" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos de valor */}
              <FormField
                control={form.control}
                name="valor_litro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por Litro (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="decimal"
                        placeholder="5.79"
                        {...field}
                        onChange={(e) => {
                          if (isAdmin) {
                            field.onChange(e);
                            setValorLitro(e.target.value);
                          }
                        }}
                        value={valorLitro}
                        disabled={!isAdmin}
                        className={`text-lg font-medium ${isAdmin ? "" : "bg-gray-100"}`}
                        style={{ height: "48px" }}
                      />
                    </FormControl>
                    {!isAdmin && (
                      <FormDescription className="text-xs text-muted-foreground">
                        Somente administradores podem alterar o valor por litro
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="decimal"
                        placeholder="0.00"
                        {...field}
                        value={valorTotal}
                        disabled={true}
                        className="text-lg font-medium bg-gray-100"
                        style={{ height: "48px" }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Calculado automaticamente (quantidade × valor por litro)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção do projeto e pessoas */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3">
              Projeto e Responsáveis
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="projeto"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SeletorProjetos
                        value={field.value}
                        onChange={field.onChange}
                        required={true}
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
                    <FormLabel>Nome do Motorista</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="João Silva"
                        {...field}
                        className="text-lg"
                        style={{ height: "48px" }}
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
                        placeholder="00.000.000-0"
                        {...field}
                        className="text-lg"
                        style={{ height: "48px" }}
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
                    <FormLabel>Nome do Operador</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Carlos Oliveira"
                        {...field}
                        className="text-lg"
                        style={{ height: "48px" }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            type="submit"
            size="lg"
            className="w-full p-6 text-lg font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Registrar Abastecimento"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Componente de sucesso ao registrar
const TelaSucesso = ({
  onHistorico,
  onNovoRegistro,
}: {
  onHistorico: () => void;
  onNovoRegistro: () => void;
}) => {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-3 mb-6">
        <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-2xl font-bold mb-2">Registrado com Sucesso!</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        O abastecimento foi registrado com sucesso no sistema. Você pode
        verificar o histórico ou fazer um novo registro.
      </p>
      <div className="flex gap-4 w-full max-w-md">
        <Button
          variant="outline"
          className="flex-1 text-sm"
          onClick={onHistorico}
        >
          Ver Histórico
        </Button>
        <Button className="flex-1 text-sm" onClick={onNovoRegistro}>
          Novo Registro
        </Button>
      </div>
    </div>
  );
};

// Componente principal
const FormularioAbastecimento: React.FC<
  FormularioAbastecimentoProps
> = ({ postId, onRegistroSucesso }) => {
  const { toast } = useToast();
  const [registroSucesso, setRegistroSucesso] = useSafeState(false);
  const [isSubmitting, setIsSubmitting] = useSafeState(false);
  const [isUserAdmin, setIsUserAdmin] = useSafeState(false);
  const [dieselValorLitro, setDieselValorLitro] = useSafeState("6.39"); // Valor fixo conforme solicitado
  const [arlaValorLitro, setArlaValorLitro] = useSafeState("4.25");
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  // Efeito para gerenciar ciclo de vida do componente
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função atualizada para garantir a atualização do histórico
  const processarSubmissao = useCallback(
    async (data: AbastecimentoValues) => {
      if (processingRef.current) return;

      processingRef.current = true;
      setIsSubmitting(true);

      try {
        console.log("Iniciando registro de abastecimento");

        // Dados fixos conforme requisito
        const valorPorLitro =
          data.tipo === "Diesel" ? 6.39 : Number(data.valor_litro);
        const valorTotal = Number(data.quantidade) * valorPorLitro;

        // Prepara os dados com múltiplos nomes de campos para compatibilidade
        const dadosAbastecimento = {
          // Campos de quantidade com múltiplos nomes para garantir compatibilidade
          quantidade_litros: Number(data.quantidade),
          quantidade: Number(data.quantidade),
          litros: Number(data.quantidade),
          
          // Campos de identificação do veículo
          placa: data.placa.toUpperCase(),
          
          // Campos de quilometragem com múltiplos nomes
          km_atual: Number(data.km),
          km: Number(data.km),
          
          // Campos de posto com múltiplos nomes
          posto_id: postId,
          posto: postId,
          
          // Campos de preço com múltiplos nomes
          preco_litro: valorPorLitro,
          valor_litro: valorPorLitro,
          
          // Valor total do abastecimento
          valor_total: valorTotal,
          
          // Campos de tipo de combustível com múltiplos nomes
          tipo_combustivel: data.tipo,
          tipo: data.tipo,
          
          // Campos de motorista com múltiplos nomes
          nome_motorista: data.motorista,
          motorista: data.motorista,
          
          // Campos de RG do motorista com múltiplos nomes
          rg_motorista: data.motorista_rg,
          motorista_rg: data.motorista_rg,
          
          // Campos de operador com múltiplos nomes
          nome_operador: data.operador,
          operador: data.operador,
          
          // Campos de projeto com múltiplos nomes
          project: data.projeto,
          projeto: data.projeto,
          
          // Tipo de veículo
          tipo_veiculo: data.tipo_veiculo || "frota",
        };
        
        console.log("Enviando dados de abastecimento:", dadosAbastecimento);

        // 1. Verificar se estamos processando Campinas V2 para usar a rota direta
        let endpoint = "";
        let usarRotaDireta = false;
        
        if (postId.toLowerCase() === "campinas_v2" || 
            postId.toLowerCase().includes("campinas_v2") || 
            postId.toLowerCase().includes("campinas v2")) {
          // Usar a rota direta para Campinas V2
          endpoint = `/api/abastecimento-direto/campinas_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Campinas V2");
        } else if (postId.toLowerCase() === "osasco_v2" || 
            postId.toLowerCase().includes("osasco_v2") || 
            postId.toLowerCase().includes("osasco v2")) {
          // Usar a rota direta para Osasco V2
          endpoint = `/api/abastecimento-direto/osasco_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Osasco V2");
        } else if (postId.toLowerCase() === "socorro_v2" || 
            postId.toLowerCase().includes("socorro_v2") || 
            postId.toLowerCase().includes("socorro v2")) {
          // Usar a rota direta para Socorro V2
          endpoint = `/api/abastecimento-direto/socorro_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Socorro V2");
        } else if (postId.toLowerCase() === "sorocaba_v2" || 
            postId.toLowerCase().includes("sorocaba_v2") || 
            postId.toLowerCase().includes("sorocaba v2")) {
          // Usar a rota direta para Sorocaba V2
          endpoint = `/api/abastecimento-direto/sorocaba_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Sorocaba V2");
        } else if (postId.toLowerCase() === "abc_v2" || 
            postId.toLowerCase().includes("abc_v2") || 
            postId.toLowerCase().includes("abc v2")) {
          // Usar a rota direta para ABC V2
          endpoint = `/api/abastecimento-direto/abc_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para ABC V2");
        } else if (postId.toLowerCase() === "guarulhos_v2" || 
            postId.toLowerCase().includes("guarulhos_v2") || 
            postId.toLowerCase().includes("guarulhos v2")) {
          // Usar API específica para Guarulhos V2 para garantir que o campo projeto seja salvo corretamente
          try {
            console.log(">>> Usando API específica para Guarulhos V2");
            
            // Importar dinamicamente a API específica do Guarulhos V2
            const { inserirAbastecimentoGuarulhosV2 } = await import("@/pages/postos/GuarulhosAPI");
            
            // Enviar diretamente através da API especializada que trata o campo projeto corretamente
            const resultado = await inserirAbastecimentoGuarulhosV2(dadosAbastecimento);
            
            console.log("Resultado da API GuarulhosV2:", resultado);
            
            // Simulando o fluxo normal para não quebrar o restante do código
            endpoint = `/api/abastecimento-direto/guarulhos_v2`;
            usarRotaDireta = false; // Marca como FALSE pois não vamos fazer a chamada normal
            
            // Já temos o resultado, podemos pular para a atualização no frontend
            if (mountedRef.current) {
              setRegistroSucesso(true);
              setIsSubmitting(false);
              processingRef.current = false;
              
              console.log("Atualizando histórico manualmente para posto guarulhos v2");
              
              // Solução definitiva: forçar atualização da página para mostrar os registros mais recentes
              // Isso garante que o histórico estará sempre atualizado após um novo registro
              setTimeout(() => {
                console.log("Recarregando página para exibir o novo registro de Guarulhos V2");
                window.location.reload();
              }, 1000);
              
              if (onRegistroSucesso) {
                onRegistroSucesso();
              }
              
              // Evitar o resto do fluxo normal
              return;
            }
            
            return; // Importante: retornar aqui para evitar o fluxo padrão
          } catch (error) {
            console.error("Erro ao usar API específica para Guarulhos V2:", error);
            // Fallback para API padrão
            endpoint = `/api/abastecimento-direto/guarulhos_v2`;
            usarRotaDireta = true;
          }
        } else if (postId.toLowerCase() === "campinas_v2" || 
            postId.toLowerCase().includes("campinas_v2") || 
            postId.toLowerCase().includes("campinas v2")) {
          // Usar API específica para Campinas V2 para garantir que o campo projeto seja salvo corretamente
          try {
            console.log(">>> Usando API específica para Campinas V2");
            
            // Usar a rota direta para Campinas V2
            endpoint = `/api/abastecimento-direto/campinas_v2`;
            
            // Garantir que o projeto esteja sendo enviado
            const dadosCampinas = {
              ...dadosAbastecimento,
              // Garantir que o projeto seja enviado de forma explícita
              projeto: dadosAbastecimento.projeto || "Não definido",
              // Também manter compatibilidade com project
              project: dadosAbastecimento.projeto || "Não definido"
            };
            
            console.log(">>> Dados enviados para Campinas V2:", dadosCampinas);
            
            // Enviar diretamente para a rota especializada
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
              },
              body: JSON.stringify(dadosCampinas)
            });
            
            const resultado = await response.json();
            console.log("Resultado da API Campinas V2:", resultado);
            
            // Simulando o fluxo normal para não quebrar o restante do código
            endpoint = `/api/abastecimento-direto/campinas_v2`;
            usarRotaDireta = false; // Marca como FALSE pois já fizemos a chamada API
            
            // Já temos o resultado, podemos pular para a atualização no frontend
            if (mountedRef.current) {
              setRegistroSucesso(true);
              setIsSubmitting(false);
              processingRef.current = false;
              
              console.log("Atualizando histórico manualmente para posto campinas v2");
              
              // Solução definitiva: forçar atualização da página para mostrar os registros mais recentes
              // Isso garante que o histórico estará sempre atualizado após um novo registro
              setTimeout(() => {
                console.log("Recarregando página para exibir o novo registro de Campinas V2");
                window.location.reload();
              }, 1000);
              
              if (onRegistroSucesso) {
                onRegistroSucesso();
              }
              
              // Evitar o resto do fluxo normal
              return;
            }
            
            return; // Importante: retornar aqui para evitar o fluxo padrão
          } catch (error) {
            console.error("Erro ao usar API específica para Campinas V2:", error);
            // Fallback para API padrão
            endpoint = `/api/abastecimento-direto/campinas_v2`;
            usarRotaDireta = true;
          }
        } else if (postId.toLowerCase() === "osasco_v2" || 
            postId.toLowerCase().includes("osasco_v2") || 
            postId.toLowerCase().includes("osasco v2")) {
          // Usar API específica para Osasco V2 para garantir que o campo projeto seja salvo corretamente
          try {
            console.log(">>> Usando API específica para Osasco V2");
            
            // Usar a rota especializada para Osasco V2
            endpoint = `/api/osasco-v2/abastecimento`;
            
            // Garantir que o projeto esteja sendo enviado
            const dadosOsasco = {
              ...dadosAbastecimento,
              // Garantir que o projeto seja enviado de forma explícita
              projeto: dadosAbastecimento.projeto || "COCA COLA",
              // Também manter compatibilidade com project
              project: dadosAbastecimento.projeto || "COCA COLA"
            };
            
            console.log(">>> Dados enviados para Osasco V2:", dadosOsasco);
            
            // Enviar diretamente para a rota especializada
            const response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
              },
              body: JSON.stringify(dadosOsasco)
            });
            
            const resultado = await response.json();
            console.log("Resultado da API Osasco V2:", resultado);
            
            // Simulando o fluxo normal para não quebrar o restante do código
            endpoint = `/api/abastecimento-direto/osasco_v2`;
            usarRotaDireta = false; // Marca como FALSE pois já fizemos a chamada API
            
            // Já temos o resultado, podemos pular para a atualização no frontend
            if (mountedRef.current) {
              setRegistroSucesso(true);
              setIsSubmitting(false);
              processingRef.current = false;
              
              console.log("Atualizando histórico manualmente para posto osasco v2");
              
              // Solução definitiva: forçar atualização da página para mostrar os registros mais recentes
              // Isso garante que o histórico estará sempre atualizado após um novo registro
              setTimeout(() => {
                console.log("Recarregando página para exibir o novo registro de Osasco V2");
                window.location.reload();
              }, 1000);
              
              if (onRegistroSucesso) {
                onRegistroSucesso();
              }
              
              // Evitar o resto do fluxo normal
              return;
            }
            
            return; // Importante: retornar aqui para evitar o fluxo padrão
          } catch (guarulhosError) {
            console.error("Erro na API específica de Guarulhos V2:", guarulhosError);
            toast({
              title: "Erro ao processar abastecimento",
              description: "Ocorreu um erro ao tentar registrar o abastecimento em Guarulhos V2. Tente novamente ou contate o suporte.",
              variant: "destructive",
            });
            
            if (mountedRef.current) {
              setIsSubmitting(false);
              processingRef.current = false;
            }
            
            return; // Retornar para evitar tentar o fluxo normal
          }
          
          // Se chegarmos aqui (não deveria acontecer), usaremos o fluxo padrão como fallback
          endpoint = `/api/abastecimento-direto/guarulhos_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Guarulhos V2 como fallback");
        } else if (postId.toLowerCase() === "alair_v2" || 
            postId.toLowerCase().includes("alair_v2") || 
            postId.toLowerCase().includes("alair v2")) {
          // Usar a rota direta para Alair V2
          endpoint = `/api/abastecimento-direto/alair_v2`;
          usarRotaDireta = true;
          console.log(">>> Usando rota específica para Alair V2");
        } else if (postId.toLowerCase().includes("remedios")) {
          endpoint = "/api/posto-remedios-standalone/abastecimentos";
        } else {
          endpoint = "/api/abastecimentos";
        }

        console.log(`Enviando para ${endpoint}`, dadosAbastecimento);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosAbastecimento),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Erro na API principal");
        }

        // 2. Depois tenta o Supabase com tabela específica para este posto (opcional)
        try {
          // Importação dinâmica para não quebrar o build se o serviço não estiver disponível
          const { postoSupabaseService } = await import("@/services/PostoSupabaseService");
          
          // Verifica primeiro se a tabela deste posto existe
          const tabelaExiste = await postoSupabaseService.verificarTabelaPosto(postId);
          
          if (tabelaExiste) {
            // Registra o abastecimento na tabela específica deste posto
            const supabaseResult = await postoSupabaseService.registrarAbastecimento(
              postId, 
              dadosAbastecimento
            );
            
            if (supabaseResult.success) {
              console.log(`Abastecimento registrado com sucesso no Supabase para o posto ${postId}:`, supabaseResult.data);
            } else {
              console.error(`Erro ao registrar abastecimento no Supabase para o posto ${postId}:`, supabaseResult.error);
              toast({
                title: "Aviso",
                description: "Registro salvo, mas houve erro ao enviar para o backup no Supabase",
                variant: "default",
              });
            }
          } else {
            console.warn(`A tabela para o posto ${postId} não existe no Supabase ainda. Tentando método antigo.`);
            
            // Tenta o método antigo como fallback
            try {
              const supabaseResult = await enviarAbastecimentoSupabase(dadosAbastecimento);
              if (!supabaseResult.success) {
                console.error("Erro no Supabase (método antigo):", supabaseResult.error);
                
                // Toast com detalhes mais específicos do erro
                toast({
                  title: "Aviso",
                  description: `Registro salvo localmente, mas houve erro ao enviar para o backup: ${supabaseResult.error}`,
                  variant: "destructive",
                  duration: 7000,
                });
              }
            } catch (supabaseFallbackError) {
              console.error("Erro crítico ao usar método antigo do Supabase:", supabaseFallbackError);
              toast({
                title: "Erro de conexão",
                description: `Falha na comunicação com o servidor Supabase: ${supabaseFallbackError instanceof Error ? supabaseFallbackError.message : String(supabaseFallbackError)}`,
                variant: "destructive",
                duration: 7000,
              });
            }
          }
        } catch (supabaseError) {
          console.error("Erro ao tentar usar o Supabase:", supabaseError);
        }

        // 3. Atualiza a UI e histórico com mensagem de sucesso mais visível
        toast({
          title: "Abastecimento Registrado!",
          description: "Os dados foram salvos com sucesso.",
          variant: "default", // Variante padrão com estilo personalizado
          duration: 5000, // Mostra por 5 segundos
          className: "bg-green-100 border-green-200", // Estilo verde personalizado
          action: (
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Concluído</span>
            </div>
          ),
        });

        // Exibe mensagem de confirmação mais ampla que será fechada depois
        setTimeout(() => {
          toast({
            title: "Histórico Atualizado",
            description: "O histórico de abastecimentos foi atualizado com o novo registro.",
            variant: "default",
            duration: 4000,
          });
        }, 1500);

        // Garante que está montado antes de atualizar estados
        if (mountedRef.current) {
          setRegistroSucesso(true);
          
          // Publicar evento para atualização em tempo real
          console.log(`[EventBus] Publicando evento de abastecimento registrado para posto: ${postId}`);
          eventosBus.publish(EVENTOS.ABASTECIMENTO_REGISTRADO, {
            posto: postId,
            data: new Date().toISOString(),
            placa: valores.placa,
            tipo_combustivel: valores.tipo_combustivel,
            quantidade_litros: valores.quantidade_litros
          });

          // SOLUÇÃO DIRETA: Forçar consulta ao banco usando fetch com SQL direto
          console.log("Iniciando mecanismo ULTRA de atualização do histórico");
          
          // Força a consulta direta ao banco para garantir que os dados mais recentes sejam mostrados
          setTimeout(async () => {
            try {
              if (mountedRef.current) {
                console.log("Forçando atualização com SQL direto para garantir dados recentes");
                
                // Chamar um fetch direto para garantir que os dados mais recentes sejam obtidos
                await fetch(`/api/execute-sql-direct`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'X-Force-Update': 'true'
                  },
                  body: JSON.stringify({
                    sql: `SELECT * FROM abastecimentos_posto_${postoFormatado} ORDER BY created_at DESC LIMIT 50`,
                    refreshCache: true
                  })
                });
                
                console.log("Consulta SQL direta concluída");
              }
            } catch (sqlErr) {
              console.warn("Erro na atualização direta com SQL:", sqlErr);
            }
          }, 300);
          
          // Chama a callback para atualizar o histórico no componente pai com múltiplas tentativas
          if (onRegistroSucesso) {
            console.log("Chamando onRegistroSucesso para atualizar histórico");
            onRegistroSucesso(); // Imediato
            
            // Segunda atualização após 500ms
            setTimeout(() => {
              if (onRegistroSucesso && mountedRef.current) {
                onRegistroSucesso();
                console.log("Histórico atualizado novamente após 500ms para garantir");
              }
            }, 500);
            
            // Terceira atualização após 1200ms
            setTimeout(() => {
              if (onRegistroSucesso && mountedRef.current) {
                onRegistroSucesso();
                console.log("Histórico atualizado pela terceira vez após 1200ms");
              }
            }, 1200);
            
            // Quarta atualização após delay maior para garantir
            setTimeout(() => {
              if (onRegistroSucesso && mountedRef.current) {
                onRegistroSucesso();
                console.log("Histórico atualizado pela quarta vez após 2500ms");
              }
            }, 2500);
            
            // Quinta e última atualização após delay ainda maior
            setTimeout(() => {
              if (onRegistroSucesso && mountedRef.current) {
                onRegistroSucesso();
                console.log("Atualização final do histórico após 4000ms");
              }
            }, 4000);
          }

          // Scroll para o histórico após 1s
          setTimeout(() => {
            const historicoSection =
              document.getElementById("historicos-section");
            if (historicoSection) {
              historicoSection.scrollIntoView({ behavior: "smooth" });
            }
          }, 1000);
        }

        // 4. Atualiza o tanque no servidor com múltiplas tentativas para garantir sucesso
        try {
          console.log("Atualizando nível do tanque...");
          
          // Primeira tentativa imediata
          const atualizarTanque = async () => {
            try {
              // Se for posto V2, forçar o nome correto para atualização do tanque
              let tanquePostoId = postId;
              
              // Tratamento para Campinas V2
              if (postId.toLowerCase().includes("campinas_v2") || postId.toLowerCase().includes("campinas v2")) {
                tanquePostoId = "Campinas_v2";
              }
              // Tratamento para Osasco V2
              else if (postId.toLowerCase().includes("osasco_v2") || postId.toLowerCase().includes("osasco v2")) {
                tanquePostoId = "Osasco_v2";
              }
              // Tratamento para Socorro V2
              else if (postId.toLowerCase().includes("socorro_v2") || postId.toLowerCase().includes("socorro v2")) {
                tanquePostoId = "Socorro_v2";
              }
              // Tratamento para Sorocaba V2
              else if (postId.toLowerCase().includes("sorocaba_v2") || postId.toLowerCase().includes("sorocaba v2")) {
                tanquePostoId = "Sorocaba_v2";
              }
              // Tratamento para ABC V2
              else if (postId.toLowerCase().includes("abc_v2") || postId.toLowerCase().includes("abc v2")) {
                tanquePostoId = "ABC_v2";
              }
              // Tratamento para Guarulhos V2
              else if (postId.toLowerCase().includes("guarulhos_v2") || postId.toLowerCase().includes("guarulhos v2")) {
                tanquePostoId = "Guarulhos_v2";
              }
              // Tratamento para Alair V2
              else if (postId.toLowerCase().includes("alair_v2") || postId.toLowerCase().includes("alair v2")) {
                tanquePostoId = "Alair_v2";
              }
              
              console.log(`Atualizando tanque para o posto: ${tanquePostoId}`);
              
              const tanqueUpdateResponse = await fetch(`/api/configuracao-tanques/${tanquePostoId}/consume`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Pragma": "no-cache",
                  "Expires": "0"
                },
                body: JSON.stringify({
                  tipo_combustivel: data.tipo,
                  litros: Number(data.quantidade),
                }),
              });

              const tanqueResult = await tanqueUpdateResponse.json();
              if (tanqueUpdateResponse.ok) {
                console.log("Tanque atualizado com sucesso:", tanqueResult);
                return true;
              } else {
                console.warn("Problema ao atualizar tanque:", tanqueResult.message);
                return false;
              }
            } catch (error) {
              console.error("Erro na requisição de atualização do tanque:", error);
              return false;
            }
          };

          // Primeira tentativa imediata
          const primeiroResultado = await atualizarTanque();
          
          // Segunda tentativa após pequeno delay se a primeira falhar
          if (!primeiroResultado) {
            setTimeout(async () => {
              console.log("Realizando segunda tentativa de atualização do tanque...");
              const segundoResultado = await atualizarTanque();
              
              // Terceira tentativa após delay maior se a segunda também falhar
              if (!segundoResultado) {
                setTimeout(async () => {
                  console.log("Realizando terceira tentativa de atualização do tanque...");
                  await atualizarTanque();
                }, 2000);
              }
            }, 1000);
          }
          
          // Notificar que o tanque foi atualizado
          setTimeout(() => {
            if (mountedRef.current) {
              toast({
                title: "Nível do Tanque",
                description: `Nível do tanque de ${data.tipo} atualizado com sucesso.`,
                variant: "default",
                duration: 3000,
              });
            }
          }, 3000);
          
        } catch (tanqueError) {
          console.error("Erro ao atualizar nível do tanque:", tanqueError);
        }
      } catch (error: any) {
        console.error("Erro no processamento:", error);
        toast({
          title: "Erro",
          description: error.message || "Falha ao registrar abastecimento",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        processingRef.current = false;
      }
    },
    [postId, toast, onRegistroSucesso],
  );

  // Funções de navegação atualizadas
  const handleVerHistorico = useCallback(() => {
    setRegistroSucesso(false);
    if (onRegistroSucesso) {
      onRegistroSucesso();
      setTimeout(() => {
        const section = document.getElementById("historicos-section");
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [onRegistroSucesso]);

  const handleNovoRegistro = useCallback(() => {
    setRegistroSucesso(false);
  }, []);

  // Renderização
  return (
    <TabsContent value="abastecimento" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Registro de Abastecimento
          </CardTitle>
          <CardDescription>
            Preencha todos os campos para registrar um abastecimento no posto{" "}
            {postId}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registroSucesso ? (
            <>
              {/* Mensagem de sucesso grande e visível */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4 mt-1">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-green-800 font-medium text-lg">Abastecimento registrado com sucesso!</h3>
                  <p className="text-green-700 mt-1">
                    Os dados foram salvos e o histórico foi atualizado. Também atualizamos o nível do tanque automaticamente.
                  </p>
                </div>
              </div>
              
              <TelaSucesso
                onHistorico={handleVerHistorico}
                onNovoRegistro={handleNovoRegistro}
              />
            </>
          ) : (
            <FormularioForm
              onSubmit={processarSubmissao}
              isSubmitting={isSubmitting}
              postId={postId}
              isAdmin={isUserAdmin}
              dieselValorLitro={dieselValorLitro}
              arlaValorLitro={arlaValorLitro}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
          <p>Data e hora serão registradas automaticamente.</p>
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default FormularioAbastecimento;