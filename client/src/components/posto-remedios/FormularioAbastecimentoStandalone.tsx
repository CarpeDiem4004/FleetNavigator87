import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// Removido importações de Select em favor de select HTML nativo
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Função utilitária para detectar e gerenciar erros DOM
const useSafeRender = () => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (event: Event) => {
      // Tratar apenas eventos de erro
      if (event instanceof ErrorEvent) {
        const errorMsg = event.error?.message || event.message;
        if (errorMsg && (
          errorMsg.includes('insertBefore') || 
          errorMsg.includes('removeChild') || 
          errorMsg.includes('Failed to execute')
        )) {
          console.log('[SAFE RENDER] Detectado erro DOM crítico, alterando modo de renderização', errorMsg);
          setHasError(true);
          // Prevenir que o erro mostre no console do usuário
          event.preventDefault();
        }
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  return hasError;
};

// Esquema de validação para o formulário de abastecimento
const abastecimentoFormSchema = z.object({
  placa: z.string().min(1, { message: 'Placa é obrigatória' }),
  km: z.coerce.number().min(1, { message: 'Quilometragem é obrigatória' }),
  projeto: z.string().min(1, { message: 'Projeto é obrigatório' }),
  motorista_nome: z.string().min(1, { message: 'Nome do motorista é obrigatório' }),
  motorista_rg: z.string().min(1, { message: 'RG do motorista é obrigatório' }),
  tipo_combustivel: z.string().min(1, { message: 'Tipo de combustível é obrigatório' }),
  quantidade_litros: z.coerce.number().optional(),
  valor_litro: z.coerce.number().optional(),
  valor_total: z.coerce.number().optional(),
  lavagem: z.boolean().default(false),
  tipo_lavagem: z.string().optional(),
  observacoes: z.string().optional(),
});

type AbastecimentoFormValues = z.infer<typeof abastecimentoFormSchema>;

// Componente simplificado usado como fallback quando erros DOM são detectados
function SimpleFormularioAbastecimento() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const formattedData = {
        posto: 'POSTO REMÉDIOS',
        data: {
          placa: String(data.placa).toUpperCase(),
          km: Number(data.km),
          projeto: String(data.projeto),
          motorista_nome: String(data.motorista_nome),
          motorista_rg: String(data.motorista_rg) || 'Não informado',
          tipo_combustivel: String(data.tipo_combustivel),
          quantidade_litros: Number(data.quantidade_litros),
          valor_litro: Number(data.valor_litro) || 6.39,
          valor_total: Number(data.valor_total),
          lavagem: data.lavagem === 'on',
          tipo_lavagem: String(data.tipo_lavagem || ''),
          observacoes: String(data.observacoes || ''),
          tipo_veiculo: 'frota'
        }
      };

      const response = await fetch('/api/supabase-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
      
      if (response.ok) {
        // Mostrar mensagem de confirmação mais visível
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white rounded-lg shadow-lg p-4 z-50 text-center font-bold';
        mensagemDiv.style.minWidth = '300px';
        mensagemDiv.innerHTML = `
          <div class="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Abastecimento registrado com sucesso!</span>
          </div>
        `;
        document.body.appendChild(mensagemDiv);
        
        // Remover a mensagem após alguns segundos
        setTimeout(() => {
          if (document.body.contains(mensagemDiv)) {
            document.body.removeChild(mensagemDiv);
          }
        }, 5000);
        
        // Limpar formulário sem recarregar a página
        e.currentTarget.reset();
        
        // Colocar foco de volta no primeiro campo para facilitar novo registro
        const placaInput = e.currentTarget.querySelector('input[name="placa"]') as HTMLInputElement;
        if (placaInput) {
          setTimeout(() => {
            placaInput.focus();
          }, 300);
        }
        
        // Tentar executar callback
        if (typeof (window as any).onSubmitSuccessPostoRemedios === 'function') {
          setTimeout(() => {
            try {
              (window as any).onSubmitSuccessPostoRemedios();
            } catch (err) {
              console.error('Erro ao atualizar histórico:', err);
            }
          }, 1000);
        }
      } else {
        alert('Erro ao salvar registro. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao processar seu pedido. Os dados podem ter sido salvos.');
    }
  };
  
  // Referência para o formulário
  const formRef = useRef<HTMLFormElement>(null);

  // Função para calcular total
  const calcularTotal = () => {
    if (formRef.current) {
      const form = formRef.current;
      const quantidade = parseFloat((form.querySelector('[name="quantidade_litros"]') as HTMLInputElement)?.value || '0');
      const valorLitro = parseFloat((form.querySelector('[name="valor_litro"]') as HTMLInputElement)?.value || '0');
      
      if (!isNaN(quantidade) && !isNaN(valorLitro)) {
        const total = quantidade * valorLitro;
        (form.querySelector('[name="valor_total"]') as HTMLInputElement).value = total.toFixed(2);
      }
    }
  };

  useEffect(() => {
    // Adicionar event listeners após a renderização
    if (formRef.current) {
      const qtdInput = formRef.current.querySelector('[name="quantidade_litros"]');
      const valorInput = formRef.current.querySelector('[name="valor_litro"]');
      
      qtdInput?.addEventListener('input', calcularTotal);
      valorInput?.addEventListener('input', calcularTotal);
      
      // Inicializar com o valor padrão
      calcularTotal();
      
      return () => {
        qtdInput?.removeEventListener('input', calcularTotal);
        valorInput?.removeEventListener('input', calcularTotal);
      };
    }
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 bg-white p-4 border rounded-md">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Formulário de Abastecimento Simplificado</h3>
        <p className="text-sm text-gray-500">Modo de compatibilidade ativado devido a erros anteriores</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Placa do Veículo*</label>
          <input name="placa" required className="w-full border rounded p-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Quilometragem*</label>
          <input name="km" type="number" required className="w-full border rounded p-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Projeto*</label>
          <select name="projeto" required className="w-full border rounded p-2">
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
            <option value="REMÉDIOS">REMÉDIOS</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Nome do Motorista*</label>
          <input name="motorista_nome" required className="w-full border rounded p-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">RG do Motorista*</label>
          <input name="motorista_rg" required className="w-full border rounded p-2" />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-3">Dados do Abastecimento</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Combustível*</label>
            <select name="tipo_combustivel" required className="w-full border rounded p-2">
              <option value="">Selecione o combustível</option>
              <option value="diesel">Diesel</option>
              <option value="gasolina">Gasolina</option>
              <option value="alcool">Álcool</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade (L)*</label>
            <input name="quantidade_litros" type="number" step="0.01" required className="w-full border rounded p-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Valor por Litro (R$)</label>
            <input name="valor_litro" type="number" step="0.01" defaultValue="6.39" className="w-full border rounded p-2" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Valor Total (R$)</label>
            <input name="valor_total" type="number" step="0.01" className="w-full border rounded p-2 bg-gray-50" readOnly />
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-3">Dados da Lavagem</h4>
        <div className="flex items-center mb-2">
          <input type="checkbox" name="lavagem" id="lavagem" className="mr-2" />
          <label htmlFor="lavagem" className="text-sm">Incluir Serviço de Lavagem</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Lavagem</label>
          <select name="tipo_lavagem" className="w-full border rounded p-2">
            <option value="">Selecione o tipo de lavagem</option>
            <option value="simples">Simples</option>
            <option value="completa">Completa</option>
            <option value="motor">Motor</option>
            <option value="chassi">Chassi</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <textarea name="observacoes" className="w-full border rounded p-2 min-h-[80px]"></textarea>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <button type="reset" className="px-4 py-2 border rounded bg-gray-100">
          Limpar
        </button>
        <button type="submit" className="px-4 py-2 border rounded bg-blue-600 text-white">
          Registrar
        </button>
      </div>
    </form>
  );
}

export default function FormularioAbastecimentoStandalone() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Usando useRef para controlar o estado de montagem do componente
  const isMounted = useRef(true);
  // Referência para elementos do formulário
  const formRef = useRef<HTMLFormElement>(null);
  // Propriedade para callback após sucesso no cadastro
  const onSubmitSuccess = (window as any).onSubmitSuccessPostoRemedios;
  
  // Sistema de prevenção contra múltiplas submissões
  const [submitting, setSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Usar o hook de renderização segura
  const useFallbackRenderer = useSafeRender();
  
  // Atualizar flag de montagem quando o componente for desmontado
  // e fazer limpeza de outros recursos
  useEffect(() => {
    console.log("[FORM ABASTECIMENTO] Componente montado");
    
    return () => {
      console.log("[FORM ABASTECIMENTO] Componente desmontado");
      isMounted.current = false;
      
      // Limpar timeout para evitar vazamento de memória
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const form = useForm<AbastecimentoFormValues>({
    resolver: zodResolver(abastecimentoFormSchema),
    defaultValues: {
      placa: '',
      km: undefined,
      projeto: '',
      motorista_nome: '',
      motorista_rg: '',
      tipo_combustivel: '', // Sem valor padrão para exigir seleção explícita
      quantidade_litros: undefined,
      valor_litro: 6.39, // Valor fixo para diesel conforme solicitado (R$6.39)
      valor_total: undefined,
      lavagem: false,
      tipo_lavagem: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: AbastecimentoFormValues) => {
    // Verificar se o componente já foi desmontado
    if (!isMounted.current) {
      console.log("Formulário foi desmontado, cancelando submissão");
      return;
    }
    
    // Verificar se já está em processo de submissão
    if (loading || submitting) {
      console.log("Já existe uma submissão em andamento, ignorando");
      return;
    }

    console.log("Iniciando envio do formulário...");
    // Definir ambos os estados de carregamento
    setLoading(true);
    setSubmitting(true);
    setSuccess(false);
    
    try {
      console.log("Preparando dados para envio:", data);
      
      // Dados formatados para envio
      const formattedData = {
        posto: 'POSTO REMÉDIOS',
        data: {
          placa: data.placa.toUpperCase(),
          km: data.km,
          projeto: data.projeto,
          motorista_nome: data.motorista_nome,
          motorista_rg: data.motorista_rg || 'Não informado',
          tipo_combustivel: data.tipo_combustivel,
          quantidade_litros: data.quantidade_litros,
          valor_litro: data.valor_litro || 6.39,
          valor_total: data.valor_total,
          lavagem: data.lavagem,
          tipo_lavagem: data.tipo_lavagem,
          observacoes: data.observacoes,
          tipo_veiculo: 'frota'
        }
      };
      
      console.log("Enviando para API server-side:", formattedData);
      
      // Usar um timeout para evitar que a requisição fique presa indefinidamente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const serverSideResponse = await fetch('/api/supabase-insert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log("Resposta da API:", serverSideResponse.status);
        
        if (serverSideResponse.ok) {
          const serverSideResult = await serverSideResponse.json();
          console.log("Resultado do processamento:", serverSideResult);
          
          if (serverSideResult.success) {
            handleSuccess("API principal");
          } else {
            console.error("Erro retornado pela API:", serverSideResult.message);
            throw new Error(serverSideResult.message || 'Erro ao processar o registro');
          }
        } else {
          console.log("Resposta da API não foi OK, tentando fallback");
          throw new Error("API principal falhou com status " + serverSideResponse.status);
        }
      } catch (primaryError) {
        console.error("Erro na API principal:", primaryError);
        
        // Tentar API de fallback
        console.log("Tentando API de fallback...");
        try {
          const fallbackResponse = await fetch('/api/posto-remedios-standalone/abastecimentos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            
            if (fallbackResult.success) {
              handleSuccess("API fallback");
            } else {
              handleError("Erro API fallback: " + (fallbackResult.message || "Falha no processamento"));
            }
          } else {
            handleError("API fallback falhou com status " + fallbackResponse.status);
          }
        } catch (fallbackError) {
          console.error("Erro completo na API fallback:", fallbackError);
          handleError("Falha em ambas as APIs. Por favor, tente novamente mais tarde.");
        }
      }
    } catch (outerError) {
      console.error('Erro geral na submissão:', outerError);
      handleError("Erro no processamento do formulário");
    } finally {
      // Só atualizar estados se o componente ainda estiver montado
      if (isMounted.current) {
        setLoading(false);
        setSubmitting(false);
        
        // Limpar qualquer timeout pendente
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
          submitTimeoutRef.current = null;
        }
        
        // Remover status de sucesso após alguns segundos
        if (success) {
          setTimeout(() => {
            if (isMounted.current) {
              setSuccess(false);
            }
          }, 3000);
        }
      }
    }
  };
  
  // Função para lidar com sucesso do envio
  const handleSuccess = (source: string) => {
    if (!isMounted.current) return;
    
    console.log(`Sucesso (via ${source}): registro adicionado com sucesso`);
    
    // Reiniciar o formulário com os valores padrão - mas manter o valor do litro
    const valorLitroAtual = form.getValues("valor_litro");
    form.reset();
    
    // Restaurar o valor por litro após resetar o formulário
    if (valorLitroAtual) {
      setTimeout(() => {
        if (isMounted.current) {
          form.setValue("valor_litro", valorLitroAtual);
        }
      }, 100);
    }
    
    setSuccess(true);
    
    // Notificar usuário usando toast
    toast({
      title: 'Sucesso',
      description: 'Registro adicionado com sucesso',
      variant: 'default',
    });
    
    // Mostrar mensagem de confirmação mais visível na tela
    try {
      const mensagemDiv = document.createElement('div');
      mensagemDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white rounded-lg shadow-lg p-4 z-50 text-center font-bold';
      mensagemDiv.style.minWidth = '300px';
      mensagemDiv.innerHTML = `
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Abastecimento registrado com sucesso!</span>
        </div>
      `;
      document.body.appendChild(mensagemDiv);
      
      // Remover a mensagem após alguns segundos
      setTimeout(() => {
        try {
          if (document.body.contains(mensagemDiv)) {
            document.body.removeChild(mensagemDiv);
          }
        } catch (err) {
          console.error("Erro ao remover mensagem:", err);
        }
      }, 5000);
    } catch (err) {
      console.error("Erro ao mostrar mensagem de sucesso:", err);
    }
    
    // Nunca recarregar a página após o envio - isso causa a tela branca no Posto Remédios Standalone
    
    // Chamar callback para atualizar a lista de registros com um pequeno atraso
    // para permitir que a lista seja atualizada depois que o banco de dados for atualizado
    setTimeout(() => {
      if (!isMounted.current) return;
      
      if (typeof onSubmitSuccess === 'function') {
        console.log("[FORM ABASTECIMENTO] Chamando callback de sucesso para atualizar histórico");
        try {
          onSubmitSuccess();
          console.log("[FORM ABASTECIMENTO] Callback executado com sucesso");
        } catch (callbackError) {
          console.error("Erro ao chamar callback de sucesso:", callbackError);
        }
      } else {
        console.log("[FORM ABASTECIMENTO] Callback não disponível ou não é uma função");
      }
    }, 500);
    
    // Garantir que a página não recarrega
    setTimeout(() => {
      if (isMounted.current) {
        // Foco no primeiro campo para facilitar a próxima entrada
        const firstInput = document.querySelector('input[name="placa"]') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 500);
  };
  
  // Função para lidar com erros
  const handleError = (message: string) => {
    if (!isMounted.current) return;
    
    console.error("Erro no processamento:", message);
    
    // Adicionar lógica específica para erros de DOM
    if (message.includes('insertBefore') || message.includes('removeChild')) {
      console.log("[FORM ABASTECIMENTO] Detectado erro de manipulação DOM, tentando recuperar");
      
      // Limpar todos os estados
      setLoading(false);
      setSubmitting(false);
      
      // Limpar qualquer timeout pendente
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
        submitTimeoutRef.current = null;
      }
      
      // Não exibir toast para evitar mais manipulações DOM
      return;
    }
    
    // Para outros erros, exibir toast normalmente
    toast({
      title: 'Erro',
      description: message,
      variant: 'destructive',
    });
  };

  // Opções de projetos
  const projetosOptions = [
    'GRUPO PEREIRA',
    'COCA COLA',
    'SHOPEE',
    'MERCADO LIVRE',
    'LINE HALL SHOPEE',
    'FULL MELI',
    'MADEIRA MADEIRA',
    'MAGALU',
    'NATURA',
    'OXXO',
    'PETLOVE',
    'REMÉDIOS',
    'Outro'
  ];

  // Função segura para submissão do formulário
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar se já está em processo de submissão para evitar cliques duplos
    if (submitting || loading) {
      console.log("[FORM ABASTECIMENTO] Ignorando submissão duplicada");
      return;
    }
    
    // Marcar como em processo de submissão
    setSubmitting(true);
    
    // Usar timeout para prevenir submissões múltiplas rápidas
    submitTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }, 3000);
    
    // Executar validação e submissão do form manualmente
    form.handleSubmit(onSubmit)(e);
  };
  
  // Se o modo de fallback estiver ativado, mostrar o formulário simplificado
  // que evita usar os componentes que podem causar erros de DOM
  if (useFallbackRenderer) {
    console.log("[FORM ABASTECIMENTO] Renderizando formulário simplificado devido a erros anteriores");
    return <SimpleFormularioAbastecimento />;
  }
  
  // Renderizar o formulário normal usando componentes shadcn/ui quando não há problemas
  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa do Veículo</FormLabel>
                <FormControl>
                  <Input placeholder="ABC1234" {...field} />
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
                <FormLabel>Quilometragem</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projeto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.value || ""}
                    onChange={(e) => {
                      if (isMounted.current) {
                        field.onChange(e.target.value);
                      }
                    }}
                  >
                    <option value="" disabled>Selecione o projeto</option>
                    {projetosOptions.map((projeto) => (
                      <option key={projeto} value={projeto}>
                        {projeto}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motorista_nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Motorista</FormLabel>
                <FormControl>
                  <Input placeholder="João da Silva" {...field} />
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
                  <Input placeholder="12.345.678-9" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Dados do Abastecimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="tipo_combustivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Combustível</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value || ""}
                      onChange={(e) => {
                        if (isMounted.current) {
                          field.onChange(e.target.value);
                        }
                      }}
                    >
                      <option value="" disabled>Selecione o combustível</option>
                      <option value="diesel">Diesel</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="alcool">Álcool</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantidade_litros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade (L)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        if (isMounted.current) {
                          // Calcular valor total automaticamente se tiver valor por litro
                          const qtd = parseFloat(e.target.value);
                          const valorLitro = form.getValues("valor_litro");
                          if (!isNaN(qtd) && valorLitro) {
                            form.setValue("valor_total", parseFloat((qtd * valorLitro).toFixed(2)));
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="0.00" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        if (isMounted.current) {
                          // Calcular valor total automaticamente se tiver quantidade
                          const valorLitro = parseFloat(e.target.value);
                          const qtd = form.getValues("quantidade_litros");
                          if (!isNaN(valorLitro) && qtd) {
                            form.setValue("valor_total", parseFloat((qtd * valorLitro).toFixed(2)));
                          }
                        }
                      }}
                    />
                  </FormControl>
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
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      className="bg-gray-50"
                      readOnly
                    />
                  </FormControl>
                  <FormDescription>
                    Calculado automaticamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Dados da Lavagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lavagem"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        if (isMounted.current) {
                          field.onChange(checked);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Incluir Serviço de Lavagem</FormLabel>
                    <FormDescription>
                      Marque esta opção se o veículo passou por lavagem
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("lavagem") && (
              <FormField
                control={form.control}
                name="tipo_lavagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Lavagem</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value || ""}
                        onChange={(e) => {
                          if (isMounted.current) {
                            field.onChange(e.target.value);
                          }
                        }}
                      >
                        <option value="" disabled>Selecione o tipo de lavagem</option>
                        <option value="simples">Simples</option>
                        <option value="completa">Completa</option>
                        <option value="motor">Motor</option>
                        <option value="chassi">Chassi</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais sobre o abastecimento ou lavagem"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (isMounted.current) {
                form.reset();
              }
            }}
            disabled={loading}
          >
            Limpar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || submitting || success}
            onClick={(e) => {
              if (loading || submitting || success) {
                e.preventDefault();
                console.log("[FORM ABASTECIMENTO] Botão clicado enquanto desabilitado");
                return;
              }
            }}
          >
            {loading || submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluído
              </>
            ) : (
              'Registrar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}