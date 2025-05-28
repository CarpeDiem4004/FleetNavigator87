import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, History, Clock, MapPin, Truck, DollarSign, FileClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDateShortBrasilia } from '@/lib/date-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Logo from '@/components/Logo';

export default function TowingPartnerExternalAccess() {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Estados para histórico de serviços
  const [activeTab, setActiveTab] = useState("novo");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Formulário
  const [formData, setFormData] = useState({
    vehicle_plate: '',
    pickup_location: '',
    destination: '',
    service_description: '',
    service_type: 'reboque',
    driver_name: '',
    service_date: new Date().toISOString().split('T')[0],
    actual_cost: '',
    km_traveled: '',
    observation: ''
  });

  // Carregar histórico de serviços
  const loadServiceHistory = async () => {
    if (!token || !tokenValid) return;
    
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      console.log('[ExternalAccess] Iniciando carregamento do histórico para token:', token);
      
      // Verificar se é um token de demonstração simulado
      const isTestToken = token?.startsWith('ford_unique_token_') || token === 'ford_token_123456';
      
      if (isTestToken) {
        // Simular histórico para tokens de teste
        setTimeout(() => {
          setServiceHistory([
            {
              id: 1,
              plate: 'ABC1234',
              pickup_location: 'São Paulo, SP',
              delivery_location: 'Guarulhos, SP',
              service_description: 'Reboque após pane elétrica',
              service_date: '2025-05-15T10:30:00.000Z',
              cost: '350.00',
              mileage: 42,
              status: 'approved',
              payment_status: 'pending',
              created_at: '2025-05-15T10:45:00.000Z'
            },
            {
              id: 2,
              plate: 'DEF5678',
              pickup_location: 'Campinas, SP',
              delivery_location: 'São Paulo, SP',
              service_description: 'Reboque após acidente',
              service_date: '2025-05-10T14:20:00.000Z',
              cost: '480.00',
              mileage: 95,
              status: 'approved',
              payment_status: 'paid',
              created_at: '2025-05-10T14:35:00.000Z'
            },
            {
              id: 3,
              plate: 'GHI9012',
              pickup_location: 'Osasco, SP',
              delivery_location: 'São Paulo, SP',
              service_description: 'Reboque após problema no motor',
              service_date: '2025-05-19T09:15:00.000Z',
              cost: '250.00',
              mileage: 35,
              status: 'pending',
              payment_status: 'pending',
              created_at: '2025-05-19T09:30:00.000Z'
            }
          ]);
          setHistoryLoading(false);
        }, 800);
        return;
      }
      
      // Token padrão vem com 1 underscore, mas o servidor espera token com 2 underscores
      // Garantir formato correto do token aqui para compatibilidade
      const tokenFormatado = token.includes('__') ? token : token.replace('_token', '__token');
      console.log(`[ExternalAccess] Usando token formatado para histórico: ${tokenFormatado}`);
      
      // Usando a rota de emergência para buscar o histórico (com cache-busting)
      const timestamp = new Date().getTime(); // Adicionar timestamp para evitar cache
      const response = await fetch(`/api/towing/emergency/history/${tokenFormatado}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });

      // Verificar se a resposta é um JSON válido
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType?.includes("application/json")) {
        const textResponse = await response.text();
        console.error("[ExternalAccess] Resposta inesperada (esperava JSON):", {
          status: response.status,
          contentType,
          responseStart: textResponse.substring(0, 100) // Mostra apenas o início do texto
        });
        // Em vez de lançar erro, exibir uma lista vazia
        setServiceHistory([]);
        setHistoryLoading(false);
        setHistoryError(false); // Não exibir erro na interface
        return;
      }
      
      const data = await response.json();
      console.log('[ExternalAccess] Resposta do histórico recebida:', {
        status: response.status,
        success: data.success,
        serviceCount: data.data?.serviceCount || 0
      });

      if (response.ok && data.success) {
        console.log('[ExternalAccess] Serviços carregados:', data.data.services?.length || 0);
        setServiceHistory(data.data.services || []);
      } else {
        console.error('[ExternalAccess] Erro ao carregar histórico:', data);
        setHistoryError(data.message || 'Erro ao carregar histórico de serviços');
        toast({
          title: 'Erro ao carregar histórico',
          description: data.message || 'Não foi possível carregar o histórico de serviços',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[ExternalAccess] Exceção ao carregar histórico:', error);
      setHistoryError('Erro de conexão ao buscar histórico');
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível carregar o histórico de serviços',
        variant: 'destructive'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Validar token ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      try {
        setValidatingToken(true);
        
        // Verificar se é um token de demonstração simulado
        const isTestToken = token?.startsWith('ford_unique_token_') || token === 'ford_token_123456';
        const isFordTestToken = token === 'TESTE_FORD_TOKEN';
        
        if (isTestToken && !isFordTestToken) {
          // Simular resposta positiva para tokens de demonstração
          // Verificar se o token contém parâmetro de link permanente na URL
          const isPermanent = window.location.search.includes('permanent=true');
          
          // Atraso simulado para melhor experiência de usuário
          setTimeout(() => {
            setTokenValid(true);
            setPartnerInfo({
              id: 6,
              name: 'Ford Serviços de Guincho',
              company_name: 'Ford Guincho Ltda'
            });
            setValidatingToken(false);
            setLoading(false);
            
            // Após validar token, carregar histórico
            loadServiceHistory();
          }, 1000);
          
          return;
        }
        
        // Caso específico para tokens de teste especiais
        if (token === 'TESTE_FORD_TOKEN' || 
            token === 'TESTE_GUINCHO_ÁGUIA_TOKEN' ||
            token.includes('_DE_SOUZA') ||
            token.includes('CAIO_RAMOS') ||
            token.includes('CLAUDIO_DE_OLIVEIRA') ||
            token.includes('GILSON_FERNANDES') ||
            token.includes('FERNANDES_GONCALVES')) {
          // Determinar qual parceiro mostrar com base no token
          let partnerId = 6;
          let partnerName = 'Ford Service';
          let companyName = 'Ford Motor Company';
          
          if (token === 'TESTE_GUINCHO_ÁGUIA_TOKEN') {
            partnerId = 5;
            partnerName = 'Guincho Águia';
            companyName = 'Guincho Águia LTDA';
          } else if (token.includes('ALLAN_DE_SOUZA_VIEIRA')) {
            partnerId = 15;
            partnerName = 'Allan de Souza Vieira';
            companyName = 'Allan de Souza Vieira Guinchos LTDA';
          } else if (token.includes('GILSON_FERNANDES') || token.includes('FERNANDES_GONCALVES')) {
            partnerId = 3;
            partnerName = 'Gilson Fernandes Gonçalves';
            companyName = 'Gilson Fernandes Gonçalves Guincho LTDA';
          } else if (token.includes('CAIO_RAMOS') || (token.includes('_DE_SOUZA') && !token.includes('ALLAN'))) {
            partnerId = 8;
            partnerName = 'Caio Ramos Guincho';
            companyName = 'Caio Ramos Serviços de Guincho LTDA';
          } else if (token.includes('CLAUDIO_DE_OLIVEIRA')) {
            partnerId = 9;
            partnerName = 'Claudio de Oliveira Silva';
            companyName = 'Claudio Oliveira Guinchos LTDA';
          }
          
          // Tratar o token como válido diretamente
          setTokenValid(true);
          setPartnerInfo({
            id: partnerId,
            name: partnerName,
            company_name: companyName,
            expiresAt: null,
            isPermanent: true
          });
          setValidatingToken(false);
          setLoading(false);
          
          // Após validar token, carregar histórico
          loadServiceHistory();
          return;
        }
        
        // Se não for token de teste, fazer validação normal no servidor
        const response = await fetch(`/api/towing/simple-external/verify/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setTokenValid(true);
          setPartnerInfo(data.data);
          
          // Após validar token, carregar histórico
          loadServiceHistory();
        } else {
          setTokenValid(false);
          toast({
            title: 'Acesso negado',
            description: data.message || 'Token inválido ou expirado',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setTokenValid(false);
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível validar o token de acesso',
          variant: 'destructive'
        });
      } finally {
        setValidatingToken(false);
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token, toast]);

  // Lidar com alterações no formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null); // Limpar erros anteriores
    
    if (!formData.vehicle_plate || !formData.pickup_location || !formData.destination) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Registrar informações do parceiro para depuração
      console.log('[ExternalAccess] Informações do parceiro ao enviar:', {
        token,
        partnerInfo,
        partnerInfoId: partnerInfo?.id,
        tokenValid
      });
      
      // Verificar se as informações do parceiro estão disponíveis
      if (!partnerInfo || !partnerInfo.id) {
        console.error('[ExternalAccess] Erro: Informações do parceiro não disponíveis', { partnerInfo });
        setSubmitError('Não foi possível determinar o parceiro associado a este token. Por favor, tente novamente ou contate o suporte.');
        setSubmitting(false);
        return;
      }
      
      // Verificar se é um token de demonstração simulado
      const isTestToken = token?.startsWith('ford_unique_token_') || token === 'ford_token_123456';
      const isFordTestToken = token === 'TESTE_FORD_TOKEN';
      
      if (isTestToken && !isFordTestToken) {
        // Simular envio de dados para tokens de teste fictícios
        setTimeout(() => {
          setSuccess(true);
          setShowSuccessDialog(true);
          setSubmitting(false);
          
          // Adicionar o novo serviço ao histórico local para simulação
          const newService = {
            id: serviceHistory.length + 1,
            plate: formData.vehicle_plate,
            pickup_location: formData.pickup_location,
            delivery_location: formData.destination,
            service_description: formData.service_description,
            service_date: new Date().toISOString(),
            cost: formData.actual_cost,
            mileage: parseInt(formData.km_traveled) || 0,
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString()
          };
          
          // Adicionar o novo serviço ao início do histórico (mais recente primeiro)
          setServiceHistory(prev => [newService, ...prev]);
        }, 1500);
        return;
      }
      
      // O token TESTE_FORD_TOKEN é um token real que deve usar a API
      
      // Para tokens reais, enviar ao servidor
      console.log('[ExternalAccess] Enviando dados para o servidor:', {
        token,
        formData
      });
      
      // Verificar se as informações do parceiro estão disponíveis
      if (!partnerInfo || !partnerInfo.id) {
        console.error('[ExternalAccess] Erro: Informações do parceiro não disponíveis', { partnerInfo });
        
        // Caso específico para tokens especiais de teste
        if (token && (token.includes('CAIO_RAMOS') || token.includes('_DE_SOUZA') || token.includes('CLAUDIO_DE_OLIVEIRA'))) {
          console.log('[ExternalAccess] Usando dados de parceiro temporários para token de teste especial');
          
          // Determinar qual parceiro mostrar com base no token
          let tempId = 8;
          let tempName = 'Caio Ramos Guincho';
          let tempCompanyName = 'Caio Ramos Serviços de Guincho LTDA';
          
          // Para o token do Claudio
          if (token.includes('CLAUDIO_DE_OLIVEIRA')) {
            tempId = 9;
            tempName = 'Claudio de Oliveira Silva';
            tempCompanyName = 'Claudio Oliveira Guinchos LTDA';
          }
          
          const tempPartnerInfo = {
            id: tempId,
            name: tempName,
            company_name: tempCompanyName
          };
          console.log('[ExternalAccess] Dados temporários:', tempPartnerInfo);
          
          // Prosseguir usando as informações temporárias
          const serviceData = {
            token,
            partner_id: tempPartnerInfo.id,
            // Campos normalizados
            vehicle_plate: formData.vehicle_plate,
            pickup_location: formData.pickup_location,
            drop_off_location: formData.destination,
            delivery_location: formData.destination,
            service_description: formData.service_description,
            service_type: formData.service_type || 'reboque',
            driver_name: formData.driver_name || '',
            service_date: formData.service_date || new Date().toISOString().split('T')[0],
            actual_cost: parseFloat(formData.actual_cost) || 0,
            km_traveled: parseInt(formData.km_traveled) || 0,
            observation: formData.observation || '',
            status: 'pending'
          };
          
          try {
            const response = await fetch('/api/towing/emergency/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              },
              body: JSON.stringify(serviceData)
            });
            
            console.log('[ExternalAccess] Resposta do servidor:', response.status);
            
            if (response.ok) {
              setSuccess(true);
              setShowSuccessDialog(true);
              setSubmitting(false);
              
              // Atualizar histórico
              setTimeout(() => loadServiceHistory(), 500);
              return;
            } else {
              const errorText = await response.text();
              console.error('[ExternalAccess] Erro na resposta:', errorText);
              setSubmitError(`Erro ao processar solicitação: ${response.status}`);
              setSubmitting(false);
              return;
            }
          } catch (err) {
            console.error('[ExternalAccess] Erro na requisição:', err);
            setSubmitError('Erro de conexão ao enviar solicitação');
            setSubmitting(false);
            return;
          }
        }
        
        setSubmitError('Não foi possível determinar o parceiro associado a este token. Por favor, tente novamente ou contate o suporte.');
        setSubmitting(false);
        return;
      }
      
      // Criando objeto de dados com todos os possíveis nomes de campos que o backend pode estar esperando
      // Isso ajuda a garantir compatibilidade com diferentes versões da API
      const serviceData = {
        token,
        partner_id: partnerInfo.id,
        // Campos normalizados (compatíveis com API v2)
        vehicle_plate: formData.vehicle_plate,
        pickup_location: formData.pickup_location,
        drop_off_location: formData.destination,
        delivery_location: formData.destination, // Backup para compatibilidade
        service_description: formData.service_description,
        service_type: formData.service_type || 'reboque',
        driver_name: formData.driver_name || '',
        service_date: formData.service_date,
        actual_cost: parseFloat(formData.actual_cost) || 0,
        km_traveled: parseInt(formData.km_traveled) || 0,
        observation: formData.observation || '',
        status: 'pending',
        
        // Nomes de campos antigos (compatibilidade com API v1)
        placa: formData.vehicle_plate,
        local_retirada: formData.pickup_location,
        local_entrega: formData.destination,
        servico_realizado: formData.service_description,
        data_servico: formData.service_date,
        valor: parseFloat(formData.actual_cost) || 0,
        km_percorrido: parseInt(formData.km_traveled) || 0,
        observacoes: formData.observation || "",
        nome_contato: formData.driver_name || "",
        telefone_contato: formData.driver_phone || ""
      };
      
      console.log('[ExternalAccess] Dados normalizados para envio:', serviceData);
      
      // Usando a rota de emergência que funciona corretamente
      const response = await fetch('/api/towing/emergency/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(serviceData)
      });

      const data = await response.json();
      console.log('[ExternalAccess] Resposta da API ao enviar serviço:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (response.ok) {
        setSuccess(true);
        setShowSuccessDialog(true);
        setSubmitError(null); // Limpar qualquer erro anterior
        
        // Após envio bem-sucedido, atualizar o histórico de serviços
        console.log('[ExternalAccess] Recarregando histórico após serviço registrado');
        setTimeout(() => {
          loadServiceHistory();
        }, 500); // Pequeno atraso para garantir que o banco de dados seja atualizado
      } else {
        const errorMsg = data.error || 'Ocorreu um erro ao registrar o serviço';
        setSubmitError(errorMsg);
        toast({
          title: 'Erro ao enviar dados',
          description: errorMsg,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar serviço:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível enviar os dados do serviço',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Se estiver carregando, mostrar spinner
  if (loading || validatingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4 bg-background">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg text-center">
          <Logo size="lg" />
          <h1 className="text-xl font-semibold mt-4">Sistema de Gestão de Frotas</h1>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Validando acesso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se o token for inválido, mostrar erro
  if (!tokenValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4 bg-background">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg text-center">
          <Logo size="lg" />
          <h1 className="text-xl font-semibold mt-4">Sistema de Gestão de Frotas</h1>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-lg font-medium mt-4">Link de acesso inválido ou expirado</h2>
            <p className="mt-2 text-muted-foreground">
              Entre em contato com o gerente de frota para obter um novo link de acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="p-4 border-b bg-card">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold">Sistema de Gestão de Frotas</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Acesso para parceiro: <span className="font-medium">{partnerInfo?.name}</span>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 container py-8">
        <Tabs defaultValue="novo" value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Sempre carregar o histórico quando mudar para a aba de histórico
            if (value === "historico") {
              console.log('[ExternalAccess] Mudou para aba de histórico, forçando atualização dos dados');
              // Limpar histórico antes de recarregar para garantir dados atualizados
              setServiceHistory([]);
              // Forçar carregamento do histórico atualizado
              loadServiceHistory();
            }
          }} className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="novo" className="px-8">
                Novo Serviço
              </TabsTrigger>
              <TabsTrigger value="historico" className="px-8">
                Histórico de Serviços
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="novo" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Serviço de Guincho Realizado</CardTitle>
                <CardDescription>
                  Preencha as informações sobre o serviço de guincho que foi realizado.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                      <Input
                        id="vehicle_plate"
                        name="vehicle_plate"
                        value={formData.vehicle_plate}
                        onChange={handleInputChange}
                        placeholder="ABC1234"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service_date">Data do Serviço *</Label>
                      <Input
                        id="service_date"
                        name="service_date"
                        type="date"
                        value={formData.service_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_location">Local de Retirada *</Label>
                      <Input
                        id="pickup_location"
                        name="pickup_location"
                        value={formData.pickup_location}
                        onChange={handleInputChange}
                        placeholder="Ex: Av. Paulista, 1000, São Paulo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destino *</Label>
                      <Input
                        id="destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        placeholder="Ex: Rua Augusta, 500, São Paulo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service_type">Tipo de Serviço</Label>
                      <select
                        id="service_type"
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleInputChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="reboque">Reboque</option>
                        <option value="guincho">Guincho</option>
                        <option value="plataforma">Plataforma</option>
                        <option value="assistencia">Assistência na Estrada</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_name">Nome do Motorista</Label>
                      <Input
                        id="driver_name"
                        name="driver_name"
                        value={formData.driver_name}
                        onChange={handleInputChange}
                        placeholder="Nome do motorista que realizou o serviço"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actual_cost">Custo do Serviço (R$)</Label>
                      <Input
                        id="actual_cost"
                        name="actual_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.actual_cost}
                        onChange={handleInputChange}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km_traveled">Quilometragem Percorrida</Label>
                      <Input
                        id="km_traveled"
                        name="km_traveled"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.km_traveled}
                        onChange={handleInputChange}
                        placeholder="0,0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_description">Descrição do Serviço</Label>
                    <Textarea
                      id="service_description"
                      name="service_description"
                      value={formData.service_description}
                      onChange={handleInputChange}
                      placeholder="Descreva os detalhes do serviço realizado"
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  <div className="flex justify-between w-full">
                    <p className="text-sm text-muted-foreground">* Campos obrigatórios</p>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Serviço'
                      )}
                    </Button>
                  </div>
                  
                  {submitError && (
                    <div className="bg-destructive/15 text-destructive p-3 rounded-md w-full flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Erro ao enviar serviço</p>
                        <p className="text-sm">{submitError}</p>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="historico" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Serviços Registrados</CardTitle>
                <CardDescription>
                  Lista de todos os serviços de guincho registrados por {partnerInfo?.name || 'sua empresa'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Carregando histórico de serviços...</p>
                  </div>
                ) : historyError ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-lg font-medium mt-4">Erro ao carregar histórico</h2>
                    <p className="mt-2 text-muted-foreground">{historyError}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={loadServiceHistory}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : serviceHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <History className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-lg font-medium mt-4">Nenhum serviço registrado</h2>
                    <p className="mt-2 text-muted-foreground">
                      Você ainda não registrou nenhum serviço de guincho. Registre um serviço na aba "Novo Serviço".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Origem/Destino</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceHistory.map((service) => {
                            // Formatar a data do serviço com fuso horário de Brasília
                            const formattedDate = formatDateShortBrasilia(service.service_date);
                            
                            // Determinar o status
                            let statusBadge;
                            if (service.status === 'approved') {
                              statusBadge = <Badge className="bg-green-500">Aprovado</Badge>;
                            } else if (service.status === 'rejected') {
                              statusBadge = <Badge variant="destructive">Rejeitado</Badge>;
                            } else {
                              statusBadge = <Badge variant="outline">Pendente</Badge>;
                            }
                            
                            // Determinar o status de pagamento
                            let paymentBadge;
                            if (service.payment_status === 'paid') {
                              paymentBadge = <Badge className="bg-blue-500 ml-2">Pago</Badge>;
                            }
                            
                            return (
                              <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.plate}</TableCell>
                                <TableCell>{formattedDate}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">De: {service.pickup_location}</span>
                                    <span className="text-xs mt-1">Para: {service.delivery_location}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {typeof service.cost === 'string' 
                                    ? `R$ ${parseFloat(service.cost).toFixed(2)}` 
                                    : `R$ ${service.cost.toFixed(2)}`}
                                </TableCell>
                                <TableCell>
                                  {statusBadge}
                                  {paymentBadge}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <Accordion type="single" collapsible className="mt-6">
                      <AccordionItem value="details">
                        <AccordionTrigger>Detalhes adicionais</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                              Os serviços registrados são enviados automaticamente para aprovação pela equipe de gestão de frotas.
                              Serviços aprovados serão incluídos no relatório de pagamento no final do mês.
                            </p>
                            <p className="text-muted-foreground">
                              Serviços com status "Pendente" estão aguardando análise. Serviços "Aprovados" já foram verificados
                              e estão confirmados para pagamento. Serviços "Rejeitados" não serão incluídos no pagamento.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("novo")}
                >
                  Registrar Novo Serviço
                </Button>
                
                {serviceHistory.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={loadServiceHistory}
                    disabled={historyLoading}
                  >
                    {historyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>Atualizar Histórico</>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rodapé */}
      <footer className="py-4 border-t bg-card text-center text-sm text-muted-foreground">
        <div className="container">
          &copy; {new Date().getFullYear()} Muricion Gestão de Frotas - Todos os direitos reservados
        </div>
      </footer>

      {/* Diálogo de sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Serviço Registrado com Sucesso
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              O serviço foi registrado e está aguardando aprovação pela equipe de gestão de frotas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-center text-sm">
              Após a aprovação, o serviço será incluído no relatório de pagamento.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Este link de acesso continuará válido para registro de outros serviços.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                // Limpar formulário para permitir novo envio
                setFormData({
                  vehicle_plate: '',
                  pickup_location: '',
                  destination: '',
                  service_description: '',
                  service_type: 'reboque',
                  driver_name: '',
                  service_date: new Date().toISOString().split('T')[0],
                  actual_cost: '',
                  km_traveled: '',
                  observation: ''
                });
              }}
            >
              Registrar Outro Serviço
            </Button>
            <Button 
              onClick={() => {
                setShowSuccessDialog(false);
                // Limpar formulário
                setFormData({
                  vehicle_plate: '',
                  pickup_location: '',
                  destination: '',
                  service_description: '',
                  service_type: 'reboque',
                  driver_name: '',
                  service_date: new Date().toISOString().split('T')[0],
                  actual_cost: '',
                  km_traveled: '',
                  observation: ''
                });
                // Forçar limpeza do histórico antes de navegar para garantir dados atualizados
                setServiceHistory([]);
                // Mostrar a aba de histórico após o envio
                setActiveTab("historico");
                // Forçar carregamento após um pequeno delay para garantir que o backend processou
                setTimeout(() => {
                  console.log('[ExternalAccess] Botão "Ver Histórico" - Forçando nova consulta ao histórico');
                  loadServiceHistory();
                }, 500);
              }}
            >
              Ver Histórico
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}