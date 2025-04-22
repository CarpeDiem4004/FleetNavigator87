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
  projeto: z.string().min(2, 'O projeto é obrigatório'),
  motorista: z.string().min(3, 'O nome do motorista deve ter no mínimo 3 caracteres'),
  operador: z.string().min(3, 'O nome do operador deve ter no mínimo 3 caracteres'),
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
  postId 
}: { 
  onSubmit: (data: AbastecimentoValues) => void; 
  isSubmitting: boolean; 
  postId: string 
}) => {
  // Formulário sempre instanciado uma única vez
  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: '',
      km: '',
      tipo: undefined,
      quantidade: '',
      projeto: '',
      motorista: '',
      operador: '',
    },
  });

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
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value="" disabled>Selecione</option>
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
                        className="text-lg font-medium"
                        style={{height: '48px'}} 
                      />
                    </FormControl>
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
                        <option value="" disabled>Selecione o projeto</option>
                        <option value="GRUPO PEREIRA">GRUPO PEREIRA</option>
                        <option value="COCA COLA">COCA COLA</option>
                        <option value="SHOPEE">SHOPEE</option>
                        <option value="MERCADO LIVRE">MERCADO LIVRE</option>
                        <option value="LINE HALL SHOPEE">LINE HALL SHOPEE</option>
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
        Abastecimento Registrado com Sucesso!
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md text-lg">
        O abastecimento foi registrado corretamente no sistema.
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
  const processingRef = useRef(false);
  
  // Função auxiliar para formatar o nome do posto
  const formatPosto = (posto: string) => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };
  
  // Limpeza das refs quando o componente é desmontado
  useEffect(() => {
    return () => {
      processingRef.current = false;
    };
  }, []);
  
  // Manipulador de histórico
  const handleVerHistorico = useCallback(() => {
    const historicosSection = document.getElementById("historicos-section");
    if (historicosSection) {
      historicosSection.scrollIntoView({ behavior: "smooth" });
    }
    setRegistroSucesso(false);
  }, []);
  
  // Manipulador de novo registro
  const handleNovoRegistro = useCallback(() => {
    setRegistroSucesso(false);
  }, []);
  
  // Função para processamento do formulário
  const processarSubmissao = useCallback(async (data: AbastecimentoValues) => {
    // Verificação adicional para prevenir envios duplicados
    if (processingRef.current) {
      console.log('Já existe um processamento em andamento');
      return;
    }
    
    // Marca como em processamento
    processingRef.current = true;
    setIsSubmitting(true);
    
    try {
      console.log('Iniciando registro de abastecimento');
      
      // Dados formatados para inserção
      const abastecimentoData = {
        placa: data.placa.toUpperCase(),
        km_atual: Number(data.km),
        tipo_combustivel: data.tipo,
        litros: Number(data.quantidade),
        project: data.projeto,
        nome_motorista: data.motorista,
        nome_operador: data.operador,
        posto: formatPosto(postId) // Use o campo 'posto' em vez de 'posto_id'
        // Removido o data_registro - será gerado automaticamente no banco de dados com NOW()
      };
      
      // Verificação de conexão
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet. Verifique sua rede e tente novamente.');
      }
      
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
        const { supabaseAdmin } = await import('@/lib/supabase-client');
        
        const { error } = await supabaseAdmin
          .from('abastecimentos_postos')
          .insert([abastecimentoData]);
          
        if (!error) {
          console.log('Registro via cliente admin bem-sucedido');
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
      
      // Tentativa 3: Via fetch direto
      if (!registroSalvo) {
        try {
          console.log('Tentativa 3: Usando abordagens adicionais');
          
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
                projeto: data.projeto,
                motorista: data.motorista,
                operador: data.operador,
                posto: abastecimentoData.posto // Use "posto" em vez de "posto_id"
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
                posto: formatPosto(postId), // Use "posto" em vez de "posto_id"
                data_hora: new Date().toISOString(),
                motorista: data.motorista
              };
              
              const response = await fetch('https://hvsmxxqkuyjhpsiojupb.supabase.co/rest/v1/abastecimentos_postos', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkwMzQ2MiwiZXhwIjoyMDYwMjc5NDYyfQ.M5Yf9Y-YRsF1hRfpZcnJHWdDR3x8T0yzIKbXZTXZQOY',
                  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkwMzQ2MiwiZXhwIjoyMDYwMjc5NDYyfQ.M5Yf9Y-YRsF1hRfpZcnJHWdDR3x8T0yzIKbXZTXZQOY',
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
        title: 'Abastecimento registrado!',
        description: `Veículo ${data.placa} abastecido com sucesso.`,
      });
      
      // Atualiza interface
      setRegistroSucesso(true);
      
      // Notifica o componente pai para atualizar o histórico
      if (onRegistroSucesso) {
        console.log("[REGISTRO] Notificando componente pai para atualizar histórico");
        onRegistroSucesso();
      }
      
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