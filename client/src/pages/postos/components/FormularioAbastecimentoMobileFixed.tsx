/**
 * Formulário de Abastecimento com Correções Específicas para Mobile
 * Resolve problemas de carregamento de projetos em dispositivos móveis
 */

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, RefreshCw, AlertTriangle, Smartphone } from "lucide-react";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { MobileSelect } from "@/components/ui/mobile-select";
import { useAuth } from "@/context/AuthContext";

// Schema de validação
const abastecimentoSchema = z.object({
  placa: z.string().min(1, "Placa é obrigatória").max(8, "Placa deve ter no máximo 8 caracteres"),
  km: z.string().min(1, "Quilometragem é obrigatória"),
  tipo: z.string().min(1, "Tipo de combustível é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  valor_litro: z.string().min(1, "Valor por litro é obrigatório"),
  valor_total: z.string().min(1, "Valor total é obrigatório"),
  projeto_id: z.string().min(1, "Selecione um projeto"),
  base_id: z.string().min(1, "Selecione uma base"),
  motorista: z.string().min(1, "Nome do motorista é obrigatório"),
  motorista_rg: z.string().min(1, "RG do motorista é obrigatório"),
  operador: z.string().min(1, "Nome do operador é obrigatório"),
  tipo_veiculo: z.string().default("frota"),
});

type AbastecimentoValues = z.infer<typeof abastecimentoSchema>;

interface FormularioAbastecimentoProps {
  postId: string;
  onRegistroSucesso?: () => void;
}

interface ProjectData {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  bases: Array<{
    id: number;
    base_name: string;
    base_code: string;
    description?: string;
  }>;
}

export const FormularioAbastecimentoMobileFixed: React.FC<FormularioAbastecimentoProps> = ({ 
  postId, 
  onRegistroSucesso 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isMobile, deviceType, isTouchDevice } = useMobileDetection();
  
  // Estados do formulário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registroSucesso, setRegistroSucesso] = useState(false);
  
  // Estados para projetos e bases com carregamento otimizado para mobile
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Estados para configuração de combustível
  const [fuelConfig, setFuelConfig] = useState<{
    diesel_valor_litro: number;
    arla_valor_litro: number;
  }>({
    diesel_valor_litro: 5.00,
    arla_valor_litro: 3.00
  });

  const form = useForm<AbastecimentoValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      placa: "",
      km: "",
      tipo: "",
      quantidade: "",
      valor_litro: "",
      valor_total: "",
      projeto_id: "",
      base_id: "",
      motorista: "",
      motorista_rg: "",
      operador: "",
      tipo_veiculo: "frota",
    },
  });

  // Preencher automaticamente o nome do operador quando o usuário for carregado
  useEffect(() => {
    if (user?.name) {
      form.setValue("operador", user.name);
    }
  }, [user, form]);

  // Função otimizada para carregar projetos em mobile
  const loadProjectsMobile = useCallback(async () => {
    console.log(`[MOBILE-FIX] Iniciando carregamento para ${deviceType}`);
    setIsLoadingProjects(true);
    setLoadingError(null);

    // Múltiplas tentativas com diferentes abordagens
    const urls = [
      '/api/projects-with-bases',
      `${window.location.origin}/api/projects-with-bases`
    ];

    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`[MOBILE-FIX] Tentativa ${i + 1}: ${urls[i]}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(urls[i], {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: i === 0 ? 'include' : 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`[MOBILE-FIX] Sucesso! ${data.data.length} projetos carregados`);
            setProjects(data.data);
            setIsLoadingProjects(false);
            return;
          }
        }
        
        console.log(`[MOBILE-FIX] Tentativa ${i + 1} falhou - Status: ${response.status}`);
        
      } catch (error) {
        console.log(`[MOBILE-FIX] Erro na tentativa ${i + 1}:`, error);
        
        if (i === urls.length - 1) {
          setLoadingError(`Erro ao carregar projetos. Verifique sua conexão e tente novamente.`);
        }
      }
    }

    setIsLoadingProjects(false);
  }, [deviceType]);

  // Função para carregar configuração de combustível do posto
  const loadFuelConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/configuracao-tanques/${postId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFuelConfig({
            diesel_valor_litro: parseFloat(data.data.diesel_valor_litro) || 5.00,
            arla_valor_litro: parseFloat(data.data.arla_valor_litro) || 3.00
          });
        }
      }
    } catch (error) {
      console.log('[FUEL-CONFIG] Usando valores padrão:', error);
    }
  }, [postId]);

  // Carregar projetos e configuração ao montar o componente
  useEffect(() => {
    loadProjectsMobile();
    loadFuelConfig();
  }, [loadProjectsMobile, loadFuelConfig]);

  // Preparar opções para os selects mobile
  const projectOptions = projects.map(project => ({
    value: project.id.toString(),
    label: project.name,
    disabled: !project.is_active
  }));

  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);
  const baseOptions = selectedProject?.bases.map(base => ({
    value: base.id.toString(),
    label: `${base.base_name} (${base.base_code})`,
    disabled: false
  })) || [];

  // Opções de combustível fixas conforme projeto original - apenas ARLA e Diesel
  const combustivelOptions = [
    { value: "diesel", label: "Diesel" },
    { value: "arla", label: "ARLA" },
  ];

  // Handlers com eventos touch otimizados
  const handleProjectChange = useCallback((value: string) => {
    setSelectedProjectId(value);
    setSelectedBaseId(""); // Reset base selection
    form.setValue("projeto_id", value);
    form.setValue("base_id", "");
  }, [form]);

  const handleBaseChange = useCallback((value: string) => {
    setSelectedBaseId(value);
    form.setValue("base_id", value);
  }, [form]);

  // Cálculo automático do valor total
  const calcularValorTotal = useCallback(() => {
    const quantidade = parseFloat(form.getValues("quantidade") || "0");
    const valorLitro = parseFloat(form.getValues("valor_litro") || "0");
    const total = quantidade * valorLitro;
    
    if (total > 0) {
      form.setValue("valor_total", total.toFixed(2));
    }
  }, [form]);

  // Handler para mudança de combustível com valores fixos do admin
  const handleFuelTypeChange = useCallback((value: string) => {
    form.setValue("tipo", value);
    
    // Definir valor por litro baseado na configuração do admin
    if (value === "diesel") {
      const dieselPrice = typeof fuelConfig.diesel_valor_litro === 'number' 
        ? fuelConfig.diesel_valor_litro 
        : parseFloat(fuelConfig.diesel_valor_litro) || 5.00;
      form.setValue("valor_litro", dieselPrice.toFixed(2));
    } else if (value === "arla") {
      const arlaPrice = typeof fuelConfig.arla_valor_litro === 'number' 
        ? fuelConfig.arla_valor_litro 
        : parseFloat(fuelConfig.arla_valor_litro) || 3.00;
      form.setValue("valor_litro", arlaPrice.toFixed(2));
    }
    
    // Recalcular valor total se já tiver quantidade
    setTimeout(() => {
      const quantidade = parseFloat(form.getValues("quantidade") || "0");
      const valorLitro = parseFloat(form.getValues("valor_litro") || "0");
      const total = quantidade * valorLitro;
      
      if (total > 0) {
        form.setValue("valor_total", total.toFixed(2));
      }
    }, 100);
  }, [form, fuelConfig]);

  // Submit do formulário
  const onSubmit = async (data: AbastecimentoValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log(`[MOBILE-FIX] Enviando formulário via ${deviceType}`);

    try {
      const formData = {
        ...data,
        posto_id: postId,
        device_type: deviceType,
        is_mobile: isMobile,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`/api/abastecimentos/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Type': deviceType,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setRegistroSucesso(true);
        toast({
          title: "Sucesso!",
          description: "Abastecimento registrado com sucesso.",
        });
        
        form.reset();
        setSelectedProjectId("");
        setSelectedBaseId("");
        
        if (onRegistroSucesso) {
          onRegistroSucesso();
        }
        
        // Aguardar um pouco antes de limpar o estado de sucesso
        setTimeout(() => {
          setRegistroSucesso(false);
        }, 3000);
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[MOBILE-FIX] Erro ao enviar:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar abastecimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header com indicador de dispositivo */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-800">
            Formulário de Abastecimento
          </h2>
        </div>
        <p className="text-sm text-blue-600">
          Dispositivo: {deviceType} | Touch: {isTouchDevice ? 'Sim' : 'Não'}
        </p>
      </div>

      {/* Status de carregamento */}
      {isLoadingProjects && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
            <span className="text-yellow-800">Carregando projetos...</span>
          </div>
        </div>
      )}

      {/* Erro de carregamento */}
      {loadingError && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 font-medium">Erro de Carregamento</span>
          </div>
          <p className="text-red-700 text-sm mb-3">{loadingError}</p>
          <Button 
            onClick={loadProjectsMobile} 
            size="sm" 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Sucesso */}
      {registroSucesso && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Abastecimento registrado com sucesso!
            </span>
          </div>
        </div>
      )}

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seleção de Projeto - Mobile Optimized */}
          <FormField
            control={form.control}
            name="projeto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Projeto *</FormLabel>
                <FormControl>
                  <MobileSelect
                    options={projectOptions}
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                    placeholder="Selecione um projeto"
                    disabled={isLoadingProjects}
                    error={!!form.formState.errors.projeto_id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seleção de Base - Mobile Optimized */}
          <FormField
            control={form.control}
            name="base_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Base *</FormLabel>
                <FormControl>
                  <MobileSelect
                    options={baseOptions}
                    value={selectedBaseId}
                    onChange={handleBaseChange}
                    placeholder={selectedProjectId ? "Selecione uma base" : "Primeiro selecione um projeto"}
                    disabled={!selectedProjectId}
                    error={!!form.formState.errors.base_id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos do formulário em grid responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="placa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa do Veículo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ABC-1234"
                      className="uppercase min-h-[44px]"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
                  <FormLabel>Quilometragem *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="12345"
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Combustível *</FormLabel>
                  <FormControl>
                    <MobileSelect
                      options={combustivelOptions}
                      value={field.value}
                      onChange={handleFuelTypeChange}
                      placeholder="Selecione o combustível"
                      error={!!form.formState.errors.tipo}
                    />
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
                  <FormLabel>Quantidade (L) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      className="min-h-[44px]"
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setTimeout(calcularValorTotal, 100);
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
                  <FormLabel>Valor/Litro (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.001"
                      placeholder="Será definido automaticamente"
                      className="min-h-[44px] bg-gray-50 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Valor fixo definido pelo administrador
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="275.00"
                      className="min-h-[44px] bg-gray-50"
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dados do motorista */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="motorista"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Motorista *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nome completo"
                      className="min-h-[44px]"
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
                  <FormLabel>RG do Motorista *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123456789"
                      className="min-h-[44px]"
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
                  <FormLabel>Nome do Operador *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Operador do posto"
                      className="min-h-[44px] bg-gray-50 cursor-not-allowed"
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

          {/* Botão de envio */}
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || isLoadingProjects}
            className="w-full min-h-[50px] text-lg font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
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

export default FormularioAbastecimentoMobileFixed;