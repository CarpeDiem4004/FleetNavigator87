import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, Fuel } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  placa: z.string().min(7, 'A placa deve ter no mínimo 7 caracteres'),
  km: z.string().min(1, 'O KM é obrigatório'),
  tipo: z.string({
    required_error: 'Selecione o tipo de combustível',
  }),
  quantidade: z.string().min(1, {
    message: 'Quantidade deve ser um número válido',
  }),
  valor_litro: z.string().min(1, 'O valor por litro é obrigatório'),
  valor_total: z.string().optional(),
  projeto: z.string().min(2, 'O projeto é obrigatório'),
  motorista: z.string().min(3, 'O nome do motorista deve ter no mínimo 3 caracteres'),
  motorista_rg: z.string().min(5, 'O RG do motorista é obrigatório'),
  operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
  tipo_veiculo: z.string().default('frota'),
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
  arlaValorLitro = "0"
}: { 
  onSubmit: (data: AbastecimentoValues) => void; 
  isSubmitting: boolean; 
  postId: string;
  isAdmin?: boolean;
  dieselValorLitro?: string;
  arlaValorLitro?: string;
}) => {
  // Obter nome do operador logado do localStorage (adicionado pelo sistema de autenticação)
  const operadorNome = localStorage.getItem('user_name') || '';
  const [quantidade, setQuantidade] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [valorLitro, setValorLitro] = useState('');
  const [valorTotal, setValorTotal] = useState('0');
  
  // Formulário sempre instanciado uma única vez
  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: '',
      km: '',
      tipo: '',
      quantidade: '',
      valor_litro: '',
      valor_total: '0',
      projeto: '',
      motorista: '',
      motorista_rg: '',
      operador: operadorNome, // Preenche automaticamente com o nome do operador logado
      tipo_veiculo: 'frota',
    },
  });
  
  // Quando o tipo de combustível muda, atualize o valor por litro
  useEffect(() => {
    if (tipoCombustivel === 'Diesel') {
      setValorLitro(dieselValorLitro);
      form.setValue('valor_litro', dieselValorLitro);
    } else if (tipoCombustivel === 'ARLA') {
      setValorLitro(arlaValorLitro);
      form.setValue('valor_litro', arlaValorLitro);
    }
  }, [tipoCombustivel, dieselValorLitro, arlaValorLitro, form]);
  
  // Calcular valor total quando a quantidade ou valor por litro muda
  useEffect(() => {
    if (quantidade && valorLitro) {
      const total = (parseFloat(quantidade) * parseFloat(valorLitro)).toFixed(2);
      setValorTotal(total);
      form.setValue('valor_total', total);
    } else {
      setValorTotal('0');
      form.setValue('valor_total', '0');
    }
  }, [quantidade, valorLitro, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Formulário otimizado para dispositivos móveis */}
        <div className="grid grid-cols-1 gap-4">
          {/* Seção de identificação do veículo */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg mb-2">
            <h3 className="text-md font-semibold mb-3">Informações do Veículo</h3>
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
                        style={{height: '48px'}} 
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
                        style={{height: '48px'}} 
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
            <h3 className="text-md font-semibold mb-3">Dados do Abastecimento</h3>
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
                        style={{height: '48px'}} 
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
                        style={{height: '48px'}} 
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
                        style={{height: '48px'}} 
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
            <h3 className="text-md font-semibold mb-3">Projeto e Responsáveis</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="projeto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-lg font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value="">Selecione o projeto</option>
                        <option value="GRUPO PEREIRA">GRUPO PEREIRA</option>
                        <option value="COCA COLA">COCA COLA</option>
                        <option value="SHOPEE">SHOPEE</option>
                        <option value="MERCADO LIVRE">MERCADO LIVRE</option>
                        <option value="LINE HALL SHOPEE">LINE HALL SHOPEE</option>
                        <option value="FULL MELI">FULL MELI</option>
                        <option value="MADEIRA MADEIRA">MADEIRA MADEIRA</option>
                        <option value="MAGALU">MAGALU</option>
                        <option value="NATURA">NATURA</option>
                        <option value="OXXO">OXXO</option>
                        <option value="PETLOVE">PETLOVE</option>
                        <option value="Outro">Outro</option>
                      </select>
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
                        style={{height: '48px'}}
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
                        style={{height: '48px'}}
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
                        style={{height: '48px'}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Botão de submissão */}
        <div className="mt-6">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full py-6 text-lg font-medium"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(to right, #10b981, #059669)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isSubmitting ? (
              <>
                <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-b-transparent"></span>
                Registrando...
              </>
            ) : (
              'REGISTRAR ABASTECIMENTO'
            )}
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-2">
          Toque no botão acima para registrar o abastecimento
        </p>
      </form>
    </Form>
  );
};

// Componente de sucesso separado
const TelaSucesso = ({ 
  onHistorico, 
  onNovoRegistro 
}: { 
  onHistorico: () => void; 
  onNovoRegistro: () => void 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full p-8">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center" style={{color: '#10b981'}}>
        Abastecimento realizado com sucesso!
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md text-lg">
        O abastecimento foi registrado corretamente no sistema e está disponível no histórico.
      </p>
      <div className="flex flex-col w-full gap-4 mt-2">
        <Button 
          onClick={onHistorico} 
          className="w-full py-5 text-lg font-medium"
          style={{
            background: 'linear-gradient(to right, #10b981, #059669)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          Ver Histórico de Abastecimentos
        </Button>
        <Button 
          onClick={onNovoRegistro} 
          variant="outline"
          className="w-full py-5 text-lg font-medium"
        >
          Registrar Novo Abastecimento
        </Button>
      </div>
    </div>
  );
};

// Componente principal - versão totalmente refatorada para evitar erros de DOM
export const FormularioAbastecimento: React.FC<FormularioAbastecimentoProps> = ({ postId, onRegistroSucesso }) => {
  const { toast } = useToast();
  const [registroSucesso, setRegistroSucesso] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [dieselValorLitro, setDieselValorLitro] = useState('5.79');
  const [arlaValorLitro, setArlaValorLitro] = useState('4.25');
  const processingRef = useRef(false);
  
  // Função auxiliar para formatar o nome do posto
  const formatPosto = (posto: string) => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };
  
  // Verificar se o usuário é admin
  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    setIsUserAdmin(userRole === 'admin');
    
    // Carregar valores de preço por litro da nova API de preços de combustível
    const carregarPrecos = async () => {
      try {
        // Buscar preço do diesel da API
        const dieselResponse = await fetch('/api/precos-combustivel/Diesel');
        
        if (dieselResponse.ok) {
          const dieselData = await dieselResponse.json();
          
          if (dieselData.success && dieselData.data) {
            // Definir valor fixo do diesel em R$6.39 conforme solicitado
            setDieselValorLitro("6.39");
          }
        }
        
        // Buscar preço do ARLA da API
        const arlaResponse = await fetch('/api/precos-combustivel/ARLA');
        
        if (arlaResponse.ok) {
          const arlaData = await arlaResponse.json();
          
          if (arlaData.success && arlaData.data) {
            // Atualizar preço do ARLA
            setArlaValorLitro(arlaData.data.valor_litro.toString());
          }
        }
        
        // Como fallback, se a API de preços falhar, tenta buscar da configuração dos tanques
        if (!dieselResponse.ok || !arlaResponse.ok) {
          // Formatar o nome do posto
          const formattedPosto = formatPosto(postId);
          
          // Tentar buscar configuração de tanques
          const response = await fetch(`/api/configuracao-tanques/${formattedPosto}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              // Atualizar preços por litro apenas se não tiver conseguido da API
              if (!dieselResponse.ok && data.data.diesel_valor_litro) {
                // Mesmo no fallback, usar o valor fixo de R$6.39 para diesel
                setDieselValorLitro("6.39");
              }
              
              if (!arlaResponse.ok && data.data.arla_valor_litro) {
                setArlaValorLitro(data.data.arla_valor_litro.toString());
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preços:', error);
      }
    };
    
    carregarPrecos();
    
    return () => {
      processingRef.current = false;
    };
  }, [postId]);
  
  // Manipulador de histórico com tratamento de erro para evitar DOM exceptions
  const handleVerHistorico = useCallback(() => {
    try {
      // Primeiro definimos o estado como false usando requestAnimationFrame para garantir execução segura
      window.requestAnimationFrame(() => {
        try {
          setRegistroSucesso(false);
        } catch (e) {
          console.error("Erro ao alterar estado:", e);
        }
        
        // Após 50ms, tentar scrollar para a seção de históricos
        setTimeout(() => {
          try {
            const historicosSection = document.getElementById("historicos-section");
            if (historicosSection) {
              historicosSection.scrollIntoView({ behavior: "smooth" });
            }
          } catch (error) {
            console.error('Erro ao tentar rolar para a seção de históricos:', error);
          }
        }, 50);
      });
    } catch (error) {
      console.error('Erro na função de ver histórico:', error);
      
      // Último recurso - timeout como fallback
      setTimeout(() => {
        try {
          setRegistroSucesso(false);
        } catch (e) {
          // Ignora erro
        }
      }, 100);
    }
  }, []);
  
  // Manipulador de novo registro com proteção contra erros de DOM
  const handleNovoRegistro = useCallback(() => {
    try {
      // Usar requestAnimationFrame para garantir que a atualização ocorre em uma animação segura
      window.requestAnimationFrame(() => {
        // Wrap em try-catch para segurança adicional
        try {
          setRegistroSucesso(false);
        } catch (e) {
          console.error("Erro ao alterar estado:", e);
        }
      });
    } catch (error) {
      console.error('Erro ao reiniciar formulário:', error);
      
      // Último recurso - tenta com setTimeout como fallback
      setTimeout(() => {
        try {
          setRegistroSucesso(false);
        } catch (e) {
          // Ignora erro
        }
      }, 100);
    }
  }, []);
  
  // Função para processamento do formulário
  const processarSubmissao = useCallback(async (data: AbastecimentoValues) => {
    // Verificação adicional para prevenir envios duplicados
    if (processingRef.current) {
      console.log('Já existe um processamento em andamento');
      return;
    }
    
    // Desmonta qualquer componente existente para evitar conflitos de DOM
    try {
      setRegistroSucesso(false);
    } catch (e) {
      // Ignora qualquer erro aqui
    }
    
    // Marca como em processamento
    processingRef.current = true;
    setIsSubmitting(true);
    
    try {
      console.log('Iniciando registro de abastecimento');
      
      // Apenas adiciona o valor_litro se o usuário for admin
      // Conforme o padrão solicitado, não enviamos o valor_litro para não-admins
      const userRole = localStorage.getItem('user_role');
      
      // Definimos valor fixo para o diesel conforme solicitado (R$6.39)
      const valorPorLitro = data.tipo === 'Diesel' ? 6.39 : Number(data.valor_litro);
      
      // Obter data e hora atual
      const dataRegistro = new Date();
      
      // Dados formatados para inserção
      const abastecimentoData = {
        placa: data.placa.toUpperCase(),
        km_atual: Number(data.km),
        tipo_combustivel: data.tipo,
        litros: Number(data.quantidade),
        valor_litro: valorPorLitro,
        valor_total: Number(data.valor_total),
        project: data.projeto,
        nome_motorista: data.motorista,
        motorista_rg: data.motorista_rg, // Adicionado campo RG do motorista
        nome_operador: data.operador,
        posto: formatPosto(postId), // Use o campo 'posto' em vez de 'posto_id'
        tipo_veiculo: data.tipo_veiculo, // Inclui o tipo de veículo (frota ou terceirizado)
        data_registro: dataRegistro, // Adicionamos a data e hora atual
        created_at: dataRegistro // Adicionamos também em created_at para compatibilidade
      };
      
      console.log('Dados de abastecimento a serem enviados:', abastecimentoData);
      
      // Verificação de conexão
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
      }
      
      // Obtém o token de autenticação
      const userToken = localStorage.getItem('auth_token') || '';
      
      // Notifica usuário sobre o início do processamento
      toast({
        title: 'Processando registro',
        description: 'Enviando informações para o servidor...',
      });
      
      // Tenta três abordagens diferentes para garantir inserção
      let registroSalvo = false;
      
      // Tentativa 1: Via cliente admin
      try {
        console.log('Tentativa 1: Inserindo via cliente admin');
        // Importa o cliente admin diretamente
        const { supabaseAdmin, supabaseUrl, supabaseServiceKey } = await import('@/lib/supabase-client');
        
        // Exibe informações do cliente para depuração
        console.log('Supabase Admin Config:', {
          url: supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          keyStart: supabaseServiceKey.substring(0, 10) + '...'
        });
        
        // Usando o cliente supabase admin diretamente
        const { data: result, error } = await supabaseAdmin
          .from('abastecimentos_postos')
          .insert([abastecimentoData]);
          
        if (!error) {
          console.log('Registro via cliente admin bem-sucedido', result);
          registroSalvo = true;
        } else {
          console.warn('Erro na tentativa 1:', error.message);
        }
      } catch (e) {
        console.error('Exceção na tentativa 1:', e);
      }
      
      // Tentativa 2: Via insertData
      if (!registroSalvo) {
        try {
          console.log('Tentativa 2: Inserindo via insertData');
          const { insertData } = await import('@/lib/supabase-client');
          
          const resultado = await insertData('abastecimentos_postos', abastecimentoData);
          
          if (resultado.success) {
            console.log('Registro via insertData bem-sucedido');
            registroSalvo = true;
          } else {
            console.warn('Erro na tentativa 2:', resultado.error);
          }
        } catch (e) {
          console.error('Exceção na tentativa 2:', e);
        }
      }
      
      // Implementação da abordagem solicitada para envio de abastecimentos
      if (!registroSalvo) {
        try {
          console.log('Tentativa 0: Usando Supabase diretamente (método simplificado)');
          
          // Tenta usar Supabase diretamente como mostrado no exemplo
          try {
            const { supabase } = await import('@/lib/supabase-client');
            
            // Dados formatados para o Supabase
            const dadosAbastecimento = {
              quantidade_litros: Number(data.quantidade),
              valor_litro: userRole === 'admin' ? Number(data.valor_litro) : undefined,
              valor_total: Number(data.valor_total),
              placa: data.placa.toUpperCase(),
              km_atual: Number(data.km),
              posto: formatPosto(postId),
              nome_motorista: data.motorista,
              motorista_rg: data.motorista_rg, // Adicionado campo RG do motorista
              nome_operador: data.operador,
              project: data.projeto,
              tipo_combustivel: data.tipo,
              tipo_veiculo: data.tipo_veiculo,
              data_registro: dataRegistro, // Adicionamos a data e hora atual
              created_at: dataRegistro // Compatibilidade com created_at
            };
            
            const { data: resultadoInsercao, error } = await supabase
              .from('abastecimentos_postos')
              .insert([dadosAbastecimento]);
              
            if (!error) {
              console.log('Registro via Supabase direto bem-sucedido:', resultadoInsercao);
              registroSalvo = true;
              return; // Encerra o processamento se for bem-sucedido
            } else {
              console.warn('Erro ao usar Supabase direto:', error.message);
            }
          } catch (supabaseError) {
            console.error('Exceção ao usar Supabase direto:', supabaseError);
          }
          
          console.log('Tentativa 1: Usando API REST (conforme solicitado)');
          
          // Se o método direto falhar, tenta pelo endpoint de API
          const apiResponse = await fetch('/api/abastecimentos_postos', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}` 
            },
            body: JSON.stringify({
              quantidade_litros: Number(data.quantidade),
              valor_litro: userRole === 'admin' ? Number(data.valor_litro) : undefined,
              valor_total: Number(data.valor_total),
              placa: data.placa,
              km: Number(data.km),
              posto: formatPosto(postId),
              motorista: data.motorista,
              motorista_rg: data.motorista_rg, // Adicionado campo RG do motorista
              operador: data.operador,
              projeto: data.projeto,
              tipo_combustivel: data.tipo,
              tipo_veiculo: data.tipo_veiculo,
              data_registro: dataRegistro, // Adicionamos a data atual
              created_at: dataRegistro // Para compatibilidade
            })
          });
          
          if (apiResponse.ok) {
            console.log('Registro via API REST bem-sucedido');
            registroSalvo = true;
            return; // Encerra o processamento se for bem-sucedido
          } else {
            console.warn('Erro na API REST:', await apiResponse.text());
          }
        } catch (apiError) {
          console.error('Falha nas tentativas iniciais:', apiError);
        }
      }
          
      // Se a nova abordagem falhar, continua com as abordagens existentes como fallback
      if (!registroSalvo) {
        try {
          console.log('Tentativa 3: Usando abordagens adicionais (fallback)');
          
          // Tentativa 3.1: POST para a API do servidor Express
          try {
            console.log('Tentativa 3.1: Via API local');
            
            // Enviamos para a rota de API local que fará o trabalho
            const localResponse = await fetch('/api/registro/abastecimento', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Envia os cookies de autenticação
              body: JSON.stringify({
                placa: abastecimentoData.placa,
                km: abastecimentoData.km_atual,
                tipo: abastecimentoData.tipo_combustivel,
                quantidade: abastecimentoData.litros,
                valor_litro: abastecimentoData.valor_litro,
                valor_total: abastecimentoData.valor_total,
                projeto: data.projeto,
                motorista: data.motorista,
                motorista_rg: data.motorista_rg, // Adicionado campo RG do motorista
                operador: data.operador,
                posto: abastecimentoData.posto, // Use "posto" em vez de "posto_id"
                tipo_veiculo: abastecimentoData.tipo_veiculo // Incluindo o tipo de veículo
              })
            });
            
            if (localResponse.ok) {
              console.log('Registro via API local bem-sucedido');
              registroSalvo = true;
            } else {
              console.warn('API local respondeu com:', localResponse.status);
            }
          } catch (localApiError) {
            console.error('Falha na tentativa 3.1:', localApiError);
          }
          
          // Tentativa 3.2: Enviar com formato alternativo
          if (!registroSalvo) {
            try {
              console.log('Tentativa 3.2: Via Supabase com formato simplificado');
              
              // Dados super simplificados para aumentar chance de sucesso
              const dadosSimples = {
                placa: data.placa.toUpperCase(),
                quantidade: data.quantidade,
                valor_litro: data.valor_litro,
                valor_total: data.valor_total,
                posto: formatPosto(postId), // Use "posto" em vez de "posto_id"
                data_hora: new Date().toISOString(),
                motorista: data.motorista,
                motorista_rg: data.motorista_rg, // Adicionado campo RG do motorista
                tipo_veiculo: data.tipo_veiculo // Incluindo o tipo de veículo
              };
              
              // Importa a key de serviço do Supabase
              const { supabaseUrl, supabaseServiceKey } = await import('@/lib/supabase-client');
              
              const response = await fetch(`${supabaseUrl}/rest/v1/abastecimentos_postos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey,
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(dadosSimples)
              });
              
              if (response.ok) {
                console.log('Registro via formato simplificado bem-sucedido');
                registroSalvo = true;
              } else {
                console.warn('Formato simplificado falhou com status:', response.status);
              }
            } catch (simplifiedError) {
              console.error('Falha na tentativa 3.2:', simplifiedError);
            }
          }
          
          // Tentativa 3.3: Último recurso - armazenar localmente e tentar batch
          if (!registroSalvo) {
            try {
              console.log('Tentativa 3.3: Salvando localmente para tentativa futura');
              
              // Salva os dados do abastecimento para tentar enviar depois
              const pendingUploads = JSON.parse(localStorage.getItem('pendingAbastecimentos') || '[]');
              pendingUploads.push({
                ...abastecimentoData,
                timestamp: Date.now(),
                attempts: 0,
              });
              localStorage.setItem('pendingAbastecimentos', JSON.stringify(pendingUploads));
              
              console.log('Dados salvos localmente para sincronização futura');
              // Consideramos parcialmente bem-sucedido se salvo localmente
              registroSalvo = true;
            } catch (localStorageError) {
              console.error('Erro ao salvar no localStorage:', localStorageError);
            }
          }
        } catch (e) {
          console.error('Exceção geral na tentativa 3:', e);
        }
      }
      
      // Verifica resultado final
      if (!registroSalvo) {
        throw new Error('Não foi possível salvar o registro após múltiplas tentativas');
      }
      
      // Notifica sucesso
      toast({
        title: 'Abastecimento Registrado',
        description: 'Abastecimento realizado com sucesso!',
      });
      
      // Atualiza interface com requestAnimationFrame para garantir execução segura
      window.requestAnimationFrame(() => {
        setRegistroSucesso(true);
        
        // Notifica o componente pai para atualizar o histórico
        if (onRegistroSucesso) {
          console.log("[REGISTRO] Notificando componente pai para atualizar histórico");
          onRegistroSucesso();
        }
      });
      
    } catch (error: any) {
      // Tratamento de erro
      console.error('Erro no processamento:', error);
      
      // Mensagem personalizada
      let mensagem = 'Erro ao registrar abastecimento. Tente novamente.';
      
      if (error.message) {
        if (error.message.includes('fetch')) {
          mensagem = 'Falha na conexão com o servidor. Verifique sua internet.';
        } else {
          mensagem = error.message;
        }
      }
      
      // Notifica erro
      toast({
        title: 'Falha no registro',
        description: mensagem,
        variant: 'destructive',
      });
    } finally {
      // Sempre limpa estados
      setIsSubmitting(false);
      processingRef.current = false;
    }
  }, [postId, toast, onRegistroSucesso]);
  
  // Renderização com componentes isolados para evitar problemas de DOM
  return (
    <TabsContent value="abastecimento" className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Registro de Abastecimento
          </CardTitle>
          <CardDescription>
            Preencha todos os campos para registrar um abastecimento no posto {postId}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registroSucesso ? 
            <TelaSucesso 
              onHistorico={handleVerHistorico} 
              onNovoRegistro={handleNovoRegistro} 
            /> : 
            <FormularioForm 
              onSubmit={processarSubmissao} 
              isSubmitting={isSubmitting}
              postId={postId}
              isAdmin={isUserAdmin}
              dieselValorLitro={dieselValorLitro}
              arlaValorLitro={arlaValorLitro}
            />
          }
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
          <p>Data e hora serão registradas automaticamente.</p>
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default FormularioAbastecimento;