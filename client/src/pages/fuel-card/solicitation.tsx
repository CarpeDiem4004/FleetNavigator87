import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, AlertCircle, ShoppingCart, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFuelCardDraft } from "@/contexts/FuelCardDraftContext";
import { VehiclePlateAutocomplete } from "@/components/vehicle-plate-autocomplete";
import { validateAndFormatPlate } from "@/lib/plate-utils";
import { cleanBaseName, getBaseDisplayName } from "@/lib/base-utils";

interface Project {
  id: number;
  name: string;
  description?: string;
  bases: ProjectBase[];
}

interface ProjectBase {
  id: number;
  base_name: string;
  base_code: string;
  description?: string;
}

interface Vehicle {
  plate: string;
  model?: string;
  status?: string;
}

interface BaseVehicle {
  id: number;
  plate: string;
  model?: string;
  status?: string;
  cartao_abastecimento?: string | null;
}

// Schema de validação para solicitação de cartão combustível
// TODOS os campos são obrigatórios exceto observações
const solicitacaoSchema = z.object({
  placa: z.string()
    .min(1, { message: "A placa é obrigatória" })
    .refine((val) => {
      const validation = validateAndFormatPlate(val);
      return validation.isValid;
    }, {
      message: "Formato de placa inválido. Use ABC1234 (antigo) ou ABC1D23 (Mercosul)"
    }),
  nomeMotorista: z.string()
    .min(3, { message: "O nome do motorista deve ter no mínimo 3 caracteres" }),
  km: z.string()
    .min(1, { message: "A quilometragem é obrigatória" })
    .regex(/^\d+$/, { message: "A quilometragem deve conter apenas números" }),
  valor_solicitado: z.string()
    .min(1, { message: "O valor solicitado é obrigatório" })
    .refine((val) => {
      const numbers = val.replace(/\D/g, '');
      return numbers.length > 0 && parseFloat(numbers) > 0;
    }, { message: "Informe um valor válido maior que zero" }),
  valor_litro: z.string()
    .min(1, { message: "O valor do litro é obrigatório" })
    .refine((val) => {
      const cleaned = val.replace(',', '.').replace(/[^\d.]/g, '');
      const num = parseFloat(cleaned);
      return !isNaN(num) && num > 0;
    }, { message: "Informe um valor do litro válido maior que zero" }),
  tipo_cartao: z.enum(["placa", "numero"], { 
    required_error: "Selecione o tipo de cartão"
  }),
  provedor_cartao: z.enum(["Ticket", "Veloe Go"], { 
    required_error: "Selecione o provedor do cartão"
  }),
  numero_cartao: z.string().optional(),
  tipo_combustivel: z.enum(["gasolina", "alcool", "diesel", "arla"], {
    required_error: "Selecione o tipo de combustível"
  }),

  motorista: z.string()
    .min(3, { message: "O nome do solicitante deve ter no mínimo 3 caracteres" }),
  telefone_celular: z.string()
    .min(14, { message: "Informe um telefone válido com DDD" })
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, { message: "Formato de telefone inválido. Use (11) 99999-9999" }),
  projeto_id: z.string()
    .min(1, { message: "Selecione um projeto" }),
  base_id: z.string()
    .min(1, { message: "Selecione uma base" }),
  observacoes: z.string().optional(),
  data_uso: z.string()
    .min(1, { message: "A data de uso é obrigatória" }),
  turno: z.enum(["AM", "PM"], {
    required_error: "Selecione o turno"
  })
});

type SolicitacaoValues = z.infer<typeof solicitacaoSchema>;

// Função auxiliar para converter Date para string YYYY-MM-DD (evita bug de timezone UTC)
const localDateToDateOnlyString = (d: Date): string => {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  return `${y}-${pad(m)}-${pad(day)}`;
};

// Função para formatar valor para moeda brasileira (R$ 1.234,56)
const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para desformatar moeda brasileira para número
const unformatCurrency = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return 0;
  return parseFloat(numbers) / 100;
};

// Função para formatar telefone enquanto digita (XX) XXXXX-XXXX
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

export default function FuelCardSolicitation() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const { addToDraft, draftCount} = useFuelCardDraft();
  
  // Verificar se já leu as regras nessa sessão
  const [showRulesDialog, setShowRulesDialog] = useState(() => {
    const alreadyRead = sessionStorage.getItem('fuel_card_rules_read');
    return !alreadyRead; // Mostrar apenas se NÃO leu
  });
  
  // Marcar como lido quando fechar o modal
  const handleCloseRulesDialog = () => {
    sessionStorage.setItem('fuel_card_rules_read', 'true');
    setShowRulesDialog(false);
  };
  
  // Card de sucesso só aparece após adicionar ao bolsão e some quando visitar o bolsão
  const [showDraftSuccess, setShowDraftSuccess] = useState(() => {
    // Não mostrar se acabou de voltar do bolsão
    const visitedDraft = sessionStorage.getItem('fuel_card_visited_draft');
    if (visitedDraft) {
      sessionStorage.removeItem('fuel_card_visited_draft'); // Limpar para próxima vez
      return false;
    }
    return false;
  });
  const [currentDraftCount, setCurrentDraftCount] = useState(0);
  
  // Buscar veículos para autocomplete (lista global para fallback)
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    select: (data: any[]) => data.map(v => ({ plate: v.plate, model: v.model, status: v.status })),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // State para rastrear veículo selecionado
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // State para veículos da base selecionada
  const [baseVehicles, setBaseVehicles] = useState<BaseVehicle[]>([]);
  const [isLoadingBaseVehicles, setIsLoadingBaseVehicles] = useState(false);
  
  // State para cartão do veículo selecionado
  const [selectedBaseVehicle, setSelectedBaseVehicle] = useState<BaseVehicle | null>(null);
  const [manualCardPlate, setManualCardPlate] = useState("");
  
  const form = useForm<SolicitacaoValues>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      placa: "",
      nomeMotorista: "",
      km: "",
      valor_solicitado: "",
      valor_litro: "",
      tipo_cartao: "placa",
      provedor_cartao: "Ticket",
      numero_cartao: "",
      tipo_combustivel: "diesel",
      motorista: "",
      telefone_celular: "",
      projeto_id: "",
      base_id: "",
      observacoes: "",
      data_uso: "",
      turno: undefined
    }
  });
  
  const tipoCartao = form.watch("tipo_cartao");
  const selectedProjectId = form.watch("projeto_id");
  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);
  const selectedPlate = form.watch("placa");
  
  // Rastrear veículo selecionado para validação de manutenção
  useEffect(() => {
    if (selectedPlate && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.plate === selectedPlate);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedPlate, vehicles]);

  // Carregar projetos
  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoadingProjects(true);
        
        const response = await fetch("/api/projects-with-bases", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setProjects(data.data);
        } else {
          throw new Error(data.message || "Erro ao carregar projetos");
        }
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
        setError("Erro ao carregar a lista de projetos");
      } finally {
        setIsLoadingProjects(false);
      }
    }
    
    loadProjects();
  }, []);

  // Reset base selection when project changes
  useEffect(() => {
    if (selectedProjectId) {
      form.setValue("base_id", "");
      setBaseVehicles([]);
      setSelectedBaseVehicle(null);
      setManualCardPlate("");
      form.setValue("placa", "");
    }
  }, [selectedProjectId, form]);
  
  // Buscar veículos quando a base é selecionada
  const selectedBaseId = form.watch("base_id");
  useEffect(() => {
    async function loadBaseVehicles() {
      if (!selectedBaseId) {
        setBaseVehicles([]);
        setSelectedBaseVehicle(null);
        setManualCardPlate("");
        form.setValue("placa", "");
        return;
      }
      
      setIsLoadingBaseVehicles(true);
      try {
        const response = await fetch(`/api/vehicles/by-base/${selectedBaseId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setBaseVehicles(data.data || []);
          console.log(`Veículos carregados para base ${selectedBaseId}:`, data.data?.length);
        } else {
          console.error("Erro ao carregar veículos:", data.message);
          setBaseVehicles([]);
        }
      } catch (error) {
        console.error("Erro ao carregar veículos da base:", error);
        setBaseVehicles([]);
      } finally {
        setIsLoadingBaseVehicles(false);
      }
    }
    
    loadBaseVehicles();
    setSelectedBaseVehicle(null);
    setManualCardPlate("");
    form.setValue("placa", "");
  }, [selectedBaseId, form]);
  
  // Quando a placa é selecionada, verificar se tem cartão vinculado
  useEffect(() => {
    if (selectedPlate && baseVehicles.length > 0) {
      const vehicle = baseVehicles.find(v => v.plate === selectedPlate);
      setSelectedBaseVehicle(vehicle || null);
      
      if (vehicle?.cartao_abastecimento) {
        // Tem cartão vinculado - limpar campo manual
        setManualCardPlate("");
      }
    } else {
      setSelectedBaseVehicle(null);
      setManualCardPlate("");
    }
  }, [selectedPlate, baseVehicles]);
  
  async function onSubmit(values: SolicitacaoValues) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validação: Bloquear se veículo está em manutenção
      if (selectedBaseVehicle?.status === 'em_manutencao') {
        toast({
          title: "Veículo em manutenção",
          description: `O veículo ${values.placa} está em manutenção e não pode solicitar combustível no momento.`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Determinar placa do cartão (automático ou manual)
      const cartaoFinal = selectedBaseVehicle?.cartao_abastecimento || manualCardPlate;
      
      // Validação: cartão obrigatório se não tem vinculado
      if (!selectedBaseVehicle?.cartao_abastecimento && !manualCardPlate) {
        toast({
          title: "Cartão obrigatório",
          description: "Este veículo não possui cartão vinculado. Por favor, informe a placa do cartão.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validação: formato da placa do cartão manual usando a mesma validação
      if (!selectedBaseVehicle?.cartao_abastecimento) {
        const cardValidation = validateAndFormatPlate(manualCardPlate);
        if (!cardValidation.isValid) {
          toast({
            title: "Placa do cartão inválida",
            description: "Formato de placa inválido. Use ABC1234 (antigo) ou ABC1D23 (Mercosul).",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Get selected base info for legacy compatibility
      const selectedBase = selectedProject?.bases.find(b => b.id.toString() === values.base_id);
      
      // Prepare data with project/base info
      // CORREÇÃO DE TIMEZONE: Garantir que a data seja enviada no formato brasileiro sem conversão UTC
      // Data agora é obrigatória
      const data_uso_corrigida = values.data_uso.includes('-') 
        ? values.data_uso 
        : localDateToDateOnlyString(new Date(values.data_uso));
      
      console.log('[FUEL-CARD-FRONTEND] Data original:', values.data_uso, '→ Data para envio:', data_uso_corrigida);
      console.log('[FUEL-CARD-FRONTEND] Cartão final:', cartaoFinal, '(automático:', !!selectedBaseVehicle?.cartao_abastecimento, ')');
      
      const valorSolicitadoNum = unformatCurrency(values.valor_solicitado.toString());
      const valorLitroNum = unformatCurrency(values.valor_litro.toString());
      const litrosCalculados = valorLitroNum > 0 ? valorSolicitadoNum / valorLitroNum : 0;

      const processedValues = {
        placa: values.placa,
        km: parseInt(values.km.toString()),
        valor_solicitado: valorSolicitadoNum,
        valor_litro: valorLitroNum > 0 ? valorLitroNum : null,
        litros_solicitados: litrosCalculados > 0 ? parseFloat(litrosCalculados.toFixed(2)) : null,
        tipo_cartao: selectedBaseVehicle?.cartao_abastecimento ? "placa" : "numero",
        provedor_cartao: values.provedor_cartao,
        numero_cartao: cartaoFinal,
        tipo_combustivel: values.tipo_combustivel,
        motorista: values.nomeMotorista, // Nome do motorista
        solicitante: values.motorista, // Nome do solicitante
        telefone_celular: values.telefone_celular,
        base: cleanBaseName(selectedBase?.base_name) || "",
        id_rota: selectedBase?.base_code || "",
        observacoes: values.observacoes || "",
        projeto_id: parseInt(values.projeto_id),
        base_id: parseInt(values.base_id),
        data_uso: data_uso_corrigida,
        turno: values.turno
      };
      
      console.log("Enviando dados da solicitação:", processedValues);
      
      const response = await fetch("/api/fuel-card-solicitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(processedValues)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar solicitação");
      }
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de cartão combustível foi enviada com sucesso.",
      });
      
      // Passar data de uso para a página de confirmação
      sessionStorage.setItem('fuelCardConfirmation', JSON.stringify({
        successCount: 1,
        errorCount: 0,
        total: 1,
        data_uso: data_uso_corrigida
      }));
      
      // Redirecionar para página de confirmação
      setLocation("/fuel-card/confirmation");
      
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      setError(error instanceof Error ? error.message : "Ocorreu um erro ao enviar sua solicitação");
      
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  function handleAddToDraft(values: SolicitacaoValues) {
    try {
      // Validação: Bloquear se veículo está em manutenção
      if (selectedBaseVehicle?.status === 'em_manutencao') {
        toast({
          title: "Veículo em manutenção",
          description: `O veículo ${values.placa} está em manutenção e não pode solicitar combustível no momento.`,
          variant: "destructive"
        });
        return;
      }
      
      // Determinar placa do cartão (automático ou manual)
      const cartaoFinal = selectedBaseVehicle?.cartao_abastecimento || manualCardPlate;
      
      // Validação: cartão obrigatório se não tem vinculado
      if (!selectedBaseVehicle?.cartao_abastecimento && !manualCardPlate) {
        toast({
          title: "Cartão obrigatório",
          description: "Este veículo não possui cartão vinculado. Por favor, informe a placa do cartão.",
          variant: "destructive"
        });
        return;
      }
      
      // Validação: formato da placa do cartão manual usando a mesma validação
      if (!selectedBaseVehicle?.cartao_abastecimento) {
        const cardValidation = validateAndFormatPlate(manualCardPlate);
        if (!cardValidation.isValid) {
          toast({
            title: "Placa do cartão inválida",
            description: "Formato de placa inválido. Use ABC1234 (antigo) ou ABC1D23 (Mercosul).",
            variant: "destructive"
          });
          return;
        }
      }
      
      // Get selected base info
      const selectedBase = selectedProject?.bases.find(b => b.id.toString() === values.base_id);
      
      // Prepare data for draft
      // Garantir formato correto da data (já obrigatória)
      const data_uso_corrigida = values.data_uso.includes('-') 
        ? values.data_uso 
        : localDateToDateOnlyString(new Date(values.data_uso));
      
      const valorSolDraft = unformatCurrency(values.valor_solicitado.toString());
      const valorLitDraft = unformatCurrency(values.valor_litro.toString());
      const litrosDraft = valorLitDraft > 0 ? valorSolDraft / valorLitDraft : 0;

      addToDraft({
        placa: values.placa,
        km: parseInt(values.km.toString()),
        valor_solicitado: valorSolDraft,
        valor_litro: valorLitDraft > 0 ? valorLitDraft : null,
        litros_solicitados: litrosDraft > 0 ? parseFloat(litrosDraft.toFixed(2)) : null,
        tipo_cartao: selectedBaseVehicle?.cartao_abastecimento ? "placa" : "numero",
        provedor_cartao: values.provedor_cartao,
        numero_cartao: cartaoFinal,
        tipo_combustivel: values.tipo_combustivel,
        motorista: values.nomeMotorista,
        solicitante: values.motorista,
        telefone_celular: values.telefone_celular,
        base: cleanBaseName(selectedBase?.base_name) || "",
        id_rota: selectedBase?.base_code || "",
        observacoes: values.observacoes || "",
        projeto_id: parseInt(values.projeto_id),
        base_id: parseInt(values.base_id),
        data_uso: data_uso_corrigida,
        turno: values.turno,
        projeto_nome: selectedProject?.name,
        base_nome: cleanBaseName(selectedBase?.base_name)
      });
      
      // Capturar o count atualizado antes de mostrar o card
      const nextCount = draftCount + 1;
      setCurrentDraftCount(nextCount);
      
      toast({
        title: "Adicionado ao bolsão",
        description: `Solicitação adicionada. Total no bolsão: ${nextCount}`,
      });
      
      // Mostrar card de sucesso (permanece fixo após primeira adição)
      setShowDraftSuccess(true);
      
      // Limpar formulário para próxima solicitação - RESET COMPLETO com valores padrão
      form.reset({
        placa: "",
        nomeMotorista: "",
        km: "",
        valor_solicitado: "",
        valor_litro: "",
        tipo_cartao: "placa",
        provedor_cartao: "Ticket",
        numero_cartao: "",
        tipo_combustivel: "diesel",
        motorista: "",
        telefone_celular: "",
        projeto_id: "",
        base_id: "",
        observacoes: "",
        data_uso: "",
        turno: undefined
      });
      
      // Limpar estados de veículo/cartão
      setSelectedBaseVehicle(null);
      setManualCardPlate("");
      setBaseVehicles([]);
      
    } catch (error) {
      console.error("Erro ao adicionar ao bolsão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar ao bolsão",
        variant: "destructive",
      });
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
      {/* Modal de Regras */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              📢 AVISO IMPORTANTE — REGRAS PARA SOLICITAÇÃO DE SALDO
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-base font-medium text-gray-700">
              Para garantir o correto processamento das solicitações de saldo, siga atentamente as orientações abaixo:
            </p>
            
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🕓</span>
                <div>
                  <p className="font-semibold text-blue-900">Solicitações para o período da manhã (AM):</p>
                  <p className="text-blue-800">Devem ser realizadas até às 16h30 do dia anterior.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">🕛</span>
                <div>
                  <p className="font-semibold text-blue-900">Solicitações para o período da tarde (PM):</p>
                  <p className="text-blue-800">Devem ser feitas no mesmo dia, até às 12h00.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-2 pt-2 border-t border-blue-300">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-blue-900">Manutenção do Sistema (Segunda a Sexta):</p>
                  <p className="text-blue-800">De segunda a sexta-feira, às 16h30 pontualmente, é realizada a manutenção do sistema dos cartões. Durante esse processo, os saldos são zerados automaticamente. Portanto, utilizem os valores disponíveis antes desse horário para evitar qualquer transtorno.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚫</span>
                <div>
                  <p className="font-semibold text-red-900">Não misture operadoras:</p>
                  <p className="text-red-800">Exemplo: Ticket e Veloe não devem constar na mesma solicitação. E NEM DATAS DIFERENTES.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-orange-900 text-lg">AVISO IMPORTANTE – CONFIRA A PLACA ANTES DE ENVIAR</p>
                  <div className="mt-3 space-y-2 text-orange-800">
                    <p>O envio de placa incorreta poderá resultar no uso indevido do saldo por outra pessoa.</p>
                    <p className="font-semibold">O responsável pela solicitação com erro será submetido às medidas administrativas cabíveis.</p>
                    <p>Erros de placa não são aceitáveis, pois é possível realizar a conferência antes do envio.</p>
                    <p className="flex items-center gap-2 mt-3 font-semibold">
                      <span>👉</span>
                      <span>Revise todas as informações antes de enviar a solicitação.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔎</span>
                <div>
                  <p className="font-semibold text-amber-900">Verifique todas as informações antes do envio:</p>
                  <p className="text-amber-800">É possível conferir no bolsão se as solicitações estão corretas.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold text-amber-900">Atenção aos dados:</p>
                  <p className="text-amber-800">Solicitações com erro de digitação na placa ou número do cartão não serão processadas.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <p className="text-center text-gray-700 font-medium">
                Contamos com a colaboração de todos para manter o processo ágil e sem retrabalho.
              </p>
              <p className="text-center text-gray-600 text-sm mt-2">
                <strong>Equipe de Gestão de Combustível da Murici</strong>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleCloseRulesDialog}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              data-testid="button-rules-acknowledge"
            >
              ✓ Ciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-3xl">
        <div className="text-center mb-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">💳 Solicitação de Cartão</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Preencha os dados para solicitar recarga de combustível</p>
            <span className="text-xs text-gray-400">v2.1.0</span>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {selectedVehicle?.status === 'em_manutencao' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Veículo em Manutenção</AlertTitle>
            <AlertDescription>
              O veículo {selectedVehicle.plate} está atualmente em manutenção e não pode solicitar combustível.
              Por favor, selecione outro veículo.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Card de sucesso - aparece apenas após adicionar ao bolsão */}
        {showDraftSuccess && (
          <Card className="mb-6 bg-green-50 border-green-200 shadow-lg" data-testid="draft-success-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ✓ Solicitações no Bolsão
                  </h3>
                  <p className="text-green-800 mb-4">
                    Você tem <strong>{currentDraftCount}</strong> {currentDraftCount === 1 ? 'solicitação' : 'solicitações'} aguardando envio.
                  </p>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('fuel_card_visited_draft', 'true');
                      setLocation("/fuel-card/draft");
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                    data-testid="button-view-draft-fixed"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ver e Conferir Bolsão
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Botão persistente para acessar o bolsão - aparece quando há itens e card de sucesso não está visível */}
        {!showDraftSuccess && draftCount > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between" data-testid="draft-access-bar">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {draftCount} {draftCount === 1 ? 'solicitação' : 'solicitações'} no bolsão
              </span>
            </div>
            <Button
              onClick={() => setLocation("/fuel-card/draft")}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              data-testid="button-access-draft"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Bolsão
            </Button>
          </div>
        )}
        
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">📋 Dados da Solicitação</CardTitle>
            <CardDescription className="text-sm">
              Informe os dados do veículo e do cartão desejado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Seleção de Projeto e Base primeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projeto_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">📁 Projeto</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            style={{ fontSize: '16px', minHeight: '48px' }}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={isLoadingProjects}
                          >
                            <option value="">{isLoadingProjects ? "Carregando projetos..." : "Selecione um projeto"}</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id.toString()}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Selecione o projeto para esta solicitação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="base_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">🏢 Base</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            style={{ fontSize: '16px', minHeight: '48px' }}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={!selectedProject || selectedProject.bases.length === 0}
                          >
                            <option value="">
                              {!selectedProject 
                                ? "Selecione um projeto primeiro"
                                : selectedProject.bases.length === 0 
                                  ? "Nenhuma base disponível"
                                  : "Selecione uma base"}
                            </option>
                            {selectedProject?.bases.map((base) => (
                              <option key={base.id} value={base.id.toString()}>
                                {getBaseDisplayName(base.base_name)}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Base onde o veículo está alocado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Dados do veículo - aparecem após selecionar base */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">🚗 Placa do Veículo</FormLabel>
                        <FormControl>
                          <Combobox
                            value={field.value}
                            onChange={field.onChange}
                            options={baseVehicles.map((v) => ({
                              value: v.plate,
                              label: `${v.plate} ${v.cartao_abastecimento ? '🔗' : '⚠️'}`
                            }))}
                            placeholder={
                              !selectedBaseId 
                                ? "Selecione uma base primeiro"
                                : isLoadingBaseVehicles 
                                  ? "Carregando veículos..."
                                  : baseVehicles.length === 0 
                                    ? "Nenhum veículo encontrado"
                                    : "Digite ou selecione a placa"
                            }
                            emptyMessage="Nenhuma placa encontrada"
                            disabled={!selectedBaseId || isLoadingBaseVehicles}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {selectedBaseVehicle?.cartao_abastecimento 
                            ? "🔗 Cartão vinculado encontrado"
                            : selectedBaseVehicle 
                              ? "⚠️ Sem cartão vinculado - digite abaixo"
                              : "Digite para buscar ou selecione a placa"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nomeMotorista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">👤 Nome do Motorista</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="João da Silva" 
                            className="text-base h-12" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Nome completo do motorista
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">📏 Quilometragem</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="123456" 
                            className="text-base h-12" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          KM atual do veículo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor_solicitado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">💰 Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="0,00" 
                            className="text-base h-12" 
                            value={field.value ? formatCurrency(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            data-testid="input-valor-solicitado"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Digite apenas números - formatação automática
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="valor_litro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">⛽ Valor do Litro (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="Ex: 6,49" 
                            className="text-base h-12" 
                            value={field.value ? formatCurrency(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            data-testid="input-valor-litro"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Preço por litro do combustível
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_uso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">📅 Data de Uso do Saldo</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="text-base h-12" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Data prevista para utilização do combustível
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="turno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">🕐 Turno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-base h-12">
                              <SelectValue placeholder="Selecione o turno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AM">AM - Manhã</SelectItem>
                            <SelectItem value="PM">PM - Tarde</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Período do dia para uso
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Campo de cartão - automático ou manual */}
                {selectedBaseVehicle && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                    <h3 className="text-sm font-semibold text-blue-800 flex items-center">
                      💳 Cartão de Abastecimento
                    </h3>
                    
                    {selectedBaseVehicle.cartao_abastecimento ? (
                      // Cartão vinculado - campo bloqueado
                      <div>
                        <label className="text-sm font-medium text-blue-700 mb-1 block">
                          Placa do Cartão (Vinculado)
                        </label>
                        <Input 
                          value={selectedBaseVehicle.cartao_abastecimento}
                          disabled
                          className="text-base h-12 bg-green-50 border-green-300 font-semibold text-green-800"
                        />
                        <p className="text-xs text-green-700 mt-1">
                          ✓ Cartão vinculado automaticamente à placa do veículo
                        </p>
                      </div>
                    ) : (
                      // Sem cartão vinculado - campo manual
                      <div>
                        <label className="text-sm font-medium text-orange-700 mb-1 block">
                          Placa do Cartão <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          placeholder="ABC1D23"
                          value={manualCardPlate}
                          onChange={(e) => {
                            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            if (value.length > 7) return;
                            
                            const rules = [
                              /[A-Z]/, /[A-Z]/, /[A-Z]/, /[0-9]/, /[A-Z0-9]/, /[0-9]/, /[0-9]/
                            ];
                            
                            for (let i = 0; i < value.length; i++) {
                              if (!rules[i].test(value[i])) return;
                            }
                            
                            setManualCardPlate(value);
                          }}
                          maxLength={7}
                          className="text-base h-12 uppercase bg-orange-50 border-orange-300"
                        />
                        <p className="text-xs text-orange-700 mt-1">
                          ⚠️ Este veículo não possui cartão vinculado. Digite a placa do cartão que será usado.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="tipo_cartao"
                  render={({ field }) => (
                    <input type="hidden" {...field} value="placa" />
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="provedor_cartao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor do Cartão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor do cartão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Ticket">Ticket</SelectItem>
                          <SelectItem value="Veloe Go">Veloe Go</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Empresa que fornece o cartão de combustível
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_combustivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Combustível</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de combustível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="alcool">Álcool</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="arla">Arla</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Tipo de combustível para o veículo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                
                                
                {/* Seção Dados do Solicitante */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-semibold text-orange-800 mb-4 flex items-center">
                    👤 Dados do Solicitante
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="motorista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Nome</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="João da Silva" 
                              className="text-base h-12" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Nome completo do solicitante
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="telefone_celular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Telefone <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(11) 99999-9999" 
                              className="text-base h-12" 
                              value={field.value}
                              onChange={(e) => {
                                const formatted = formatPhone(e.target.value);
                                field.onChange(formatted);
                              }}
                              maxLength={16}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Para receber notificação quando aprovado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informe detalhes adicionais, se necessário" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-6 space-y-3">
                  {/* Botão: Adicionar ao Bolsão */}
                  <Button 
                    type="button"
                    onClick={form.handleSubmit(handleAddToDraft)}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                    disabled={isSubmitting}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Adicionar ao Bolsão
                  </Button>
                  
                  {/* Botão: Enviar Agora */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando solicitação...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Enviar Agora
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="w-full h-10"
                    onClick={() => setLocation("/")}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Rodapé */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Desenvolvido por Carpe Diem 4004 | suporte 11 970558053 | Sistema v2.9.4
        </div>
      </div>
    </div>
  );
}