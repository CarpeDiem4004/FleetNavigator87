import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Truck, Plus, Edit, Trash, CheckCircle, XCircle, AlertCircle, 
  Clock, Search, ExternalLink, Filter
} from 'lucide-react';
import { useFetchWithAuth } from '@/hooks/useFetchWithAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

// Tipos
interface TowingPartner {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  contato_nome: string;
  contato_telefone: string;
  data_cadastro: string;
  ativo: boolean;
}

interface TowingService {
  id: number;
  parceiro_id: number;
  parceiro_nome?: string;
  placa_veiculo: string;
  modelo_veiculo: string;
  endereco_origem: string;
  endereco_destino: string;
  quilometragem: number;
  valor: number;
  data_servico: string;
  data_lancamento: string;
  status: "pendente" | "aprovado" | "em_analise" | "negado";
  motivo_negacao: string | null;
  observacoes: string | null;
}

// Schemas de validação com Zod
const partnerFormSchema = z.object({
  nome: z.string().min(3, { message: 'Nome é obrigatório (mínimo 3 caracteres)' }),
  cnpj: z.string().min(14, { message: 'CNPJ inválido' }),
  telefone: z.string().min(10, { message: 'Telefone inválido' }),
  email: z.string().email({ message: 'Email inválido' }),
  endereco: z.string().min(5, { message: 'Endereço é obrigatório' }),
  cidade: z.string().min(2, { message: 'Cidade é obrigatória' }),
  estado: z.string().length(2, { message: 'Use a sigla do estado (2 letras)' }),
  cep: z.string().min(8, { message: 'CEP inválido' }),
  contato_nome: z.string().min(3, { message: 'Nome do contato é obrigatório' }),
  contato_telefone: z.string().min(10, { message: 'Telefone do contato inválido' })
});

const serviceFormSchema = z.object({
  parceiro_id: z.number().min(1, { message: 'Selecione um parceiro' }),
  placa_veiculo: z.string().min(7, { message: 'Placa do veículo inválida' }),
  modelo_veiculo: z.string().min(2, { message: 'Modelo do veículo é obrigatório' }),
  endereco_origem: z.string().min(5, { message: 'Endereço de origem é obrigatório' }),
  endereco_destino: z.string().min(5, { message: 'Endereço de destino é obrigatório' }),
  quilometragem: z.string().transform((val) => Number(val.replace(',', '.'))),
  valor: z.string().transform((val) => Number(val.replace(',', '.'))),
  data_servico: z.string().min(1, { message: 'Data do serviço é obrigatória' }),
  observacoes: z.string().optional()
});

const serviceStatusFormSchema = z.object({
  status: z.enum(['pendente', 'aprovado', 'em_analise', 'negado']),
  motivo_negacao: z.string().optional()
});

export default function TowingPartners() {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'gestor_frota';
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { fetchWithAuth } = useFetchWithAuth();

  // Estado dos dados
  const [partners, setPartners] = useState<TowingPartner[]>([]);
  const [services, setServices] = useState<TowingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Estados para diálogos
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<TowingPartner | null>(null);
  const [currentService, setCurrentService] = useState<TowingService | null>(null);

  // Forms
  const partnerForm = useForm<z.infer<typeof partnerFormSchema>>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      contato_nome: '',
      contato_telefone: ''
    }
  });

  const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      parceiro_id: 0,
      placa_veiculo: '',
      modelo_veiculo: '',
      endereco_origem: '',
      endereco_destino: '',
      quilometragem: '',
      valor: '',
      data_servico: '',
      observacoes: ''
    }
  });

  const statusForm = useForm<z.infer<typeof serviceStatusFormSchema>>({
    resolver: zodResolver(serviceStatusFormSchema),
    defaultValues: {
      status: 'pendente',
      motivo_negacao: ''
    }
  });

  // Carregamento inicial de dados
  useEffect(() => {
    loadPartners();
    loadServices();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/guincho/parceiros');
      if (response.ok) {
        const data = await response.json();
        setPartners(data.data || []);
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao carregar parceiros",
          description: error.message || "Não foi possível carregar a lista de parceiros",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar parceiros:", error);
      toast({
        title: "Erro ao carregar parceiros",
        description: "Ocorreu um erro ao tentar carregar os parceiros de guincho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      let url = '/api/guincho/servicos';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao carregar serviços",
          description: error.message || "Não foi possível carregar a lista de serviços",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Ocorreu um erro ao tentar carregar os serviços de guincho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de dados
  const filteredPartners = partners.filter(partner => 
    partner.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.cnpj.includes(searchTerm) ||
    partner.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(service => 
    (service.placa_veiculo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (service.modelo_veiculo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (service.parceiro_nome?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Manipuladores de eventos para formulários
  const handleAddPartner = () => {
    setCurrentPartner(null);
    partnerForm.reset({
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      contato_nome: '',
      contato_telefone: ''
    });
    setShowPartnerDialog(true);
  };

  const handleEditPartner = (partner: TowingPartner) => {
    setCurrentPartner(partner);
    partnerForm.reset({
      nome: partner.nome,
      cnpj: partner.cnpj,
      telefone: partner.telefone,
      email: partner.email,
      endereco: partner.endereco,
      cidade: partner.cidade,
      estado: partner.estado,
      cep: partner.cep,
      contato_nome: partner.contato_nome,
      contato_telefone: partner.contato_telefone
    });
    setShowPartnerDialog(true);
  };

  const handleDeletePartner = (partner: TowingPartner) => {
    setCurrentPartner(partner);
    setShowDeleteDialog(true);
  };

  const handleAddService = () => {
    setCurrentService(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    serviceForm.reset({
      parceiro_id: 0,
      placa_veiculo: '',
      modelo_veiculo: '',
      endereco_origem: '',
      endereco_destino: '',
      quilometragem: '',
      valor: '',
      data_servico: tomorrow.toISOString().split('T')[0],
      observacoes: ''
    });
    setShowServiceDialog(true);
  };

  const handleOpenStatusDialog = (service: TowingService) => {
    setCurrentService(service);
    statusForm.reset({
      status: service.status,
      motivo_negacao: service.motivo_negacao || ''
    });
    setShowStatusDialog(true);
  };

  // Submissão de formulários
  const onSubmitPartner = async (data: z.infer<typeof partnerFormSchema>) => {
    try {
      setLoading(true);
      const isEdit = !!currentPartner;
      const url = isEdit 
        ? `/api/guincho/parceiros/${currentPartner.id}`
        : '/api/guincho/parceiros';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const resultData = await response.json();
        toast({
          title: isEdit ? "Parceiro atualizado" : "Parceiro cadastrado",
          description: resultData.message || `Parceiro ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`
        });
        
        setShowPartnerDialog(false);
        loadPartners();
      } else {
        const error = await response.json();
        toast({
          title: `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} parceiro`,
          description: error.message || `Não foi possível ${isEdit ? 'atualizar' : 'cadastrar'} o parceiro`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Erro ao ${currentPartner ? 'atualizar' : 'cadastrar'} parceiro:`, error);
      toast({
        title: `Erro ao ${currentPartner ? 'atualizar' : 'cadastrar'} parceiro`,
        description: `Ocorreu um erro ao tentar ${currentPartner ? 'atualizar' : 'cadastrar'} o parceiro de guincho`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitService = async (data: z.infer<typeof serviceFormSchema>) => {
    if (Number(data.parceiro_id) === 0) {
      toast({
        title: "Erro ao registrar serviço",
        description: "Selecione um parceiro de guincho",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/guincho/servicos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          // Certifica que os valores numéricos são enviados como números
          quilometragem: typeof data.quilometragem === 'string' 
            ? Number(data.quilometragem.replace(',', '.')) 
            : data.quilometragem,
          valor: typeof data.valor === 'string' 
            ? Number(data.valor.replace(',', '.')) 
            : data.valor,
        })
      });
      
      if (response.ok) {
        const resultData = await response.json();
        toast({
          title: "Serviço registrado",
          description: resultData.message || "Serviço de guincho registrado com sucesso!"
        });
        
        setShowServiceDialog(false);
        loadServices();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao registrar serviço",
          description: error.message || "Não foi possível registrar o serviço de guincho",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao registrar serviço:", error);
      toast({
        title: "Erro ao registrar serviço",
        description: "Ocorreu um erro ao tentar registrar o serviço de guincho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitStatus = async (data: z.infer<typeof serviceStatusFormSchema>) => {
    if (!currentService) return;
    
    // Validação adicional para motivo de negação
    if (data.status === 'negado' && (!data.motivo_negacao || data.motivo_negacao.trim() === '')) {
      toast({
        title: "Erro ao atualizar status",
        description: "Informe o motivo da negação",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/guincho/servicos/${currentService.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const resultData = await response.json();
        toast({
          title: "Status atualizado",
          description: resultData.message || "Status do serviço atualizado com sucesso!"
        });
        
        setShowStatusDialog(false);
        loadServices();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar status",
          description: error.message || "Não foi possível atualizar o status do serviço",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao tentar atualizar o status do serviço",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeletePartner = async () => {
    if (!currentPartner) return;
    
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/guincho/parceiros/${currentPartner.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const resultData = await response.json();
        toast({
          title: "Parceiro excluído",
          description: resultData.message || "Parceiro excluído com sucesso!"
        });
        
        setShowDeleteDialog(false);
        loadPartners();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao excluir parceiro",
          description: error.message || "Não foi possível excluir o parceiro",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao excluir parceiro:", error);
      toast({
        title: "Erro ao excluir parceiro",
        description: "Ocorreu um erro ao tentar excluir o parceiro de guincho",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Renderização de status de serviço
  const renderServiceStatus = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" /> Aprovado
          </Badge>
        );
      case 'negado':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="mr-1 h-3 w-3" /> Negado
          </Badge>
        );
      case 'em_analise':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertCircle className="mr-1 h-3 w-3" /> Em Análise
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="mr-1 h-3 w-3" /> Pendente
          </Badge>
        );
    }
  };

  // Formatação de valores monetários e datas
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parceiros de Guincho</h1>
          <p className="text-muted-foreground">
            Gerencie parceiros de serviços de guincho e solicitações de serviços
          </p>
        </div>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="services">Serviços de Guincho</TabsTrigger>
          <TabsTrigger value="partners">Parceiros</TabsTrigger>
        </TabsList>
        
        {/* Tab de Serviços */}
        <TabsContent value="services">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por placa, modelo ou parceiro..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select 
                value={statusFilter || ''} 
                onValueChange={(value) => {
                  setStatusFilter(value || null);
                  // Recarrega os serviços com o filtro atualizado
                  setTimeout(() => loadServices(), 100);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="negado">Negados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" /> Solicitar Serviço
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Truck className="mr-2 h-5 w-5 text-primary" />
                          {service.placa_veiculo}
                        </CardTitle>
                        <CardDescription>
                          {service.modelo_veiculo}
                        </CardDescription>
                      </div>
                      <div>
                        {renderServiceStatus(service.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-3">
                      <div>
                        <strong>Parceiro:</strong> {service.parceiro_nome}
                      </div>
                      <div>
                        <strong>Origem:</strong> {service.endereco_origem}
                      </div>
                      <div>
                        <strong>Destino:</strong> {service.endereco_destino}
                      </div>
                      <div className="flex justify-between">
                        <span><strong>Km:</strong> {service.quilometragem} km</span>
                        <span><strong>Valor:</strong> {formatCurrency(service.valor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span><strong>Data:</strong> {formatDate(service.data_servico)}</span>
                      </div>
                      
                      {service.status === 'negado' && service.motivo_negacao && (
                        <div className="mt-2 text-red-500">
                          <strong>Motivo da negação:</strong> {service.motivo_negacao}
                        </div>
                      )}
                      
                      {isManager && service.status === 'pendente' && (
                        <div className="mt-4">
                          <Button 
                            onClick={() => handleOpenStatusDialog(service)}
                            className="w-full"
                            variant="outline"
                          >
                            Analisar Solicitação
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum serviço de guincho encontrado</p>
              <Button onClick={handleAddService} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Solicitar Serviço
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Tab de Parceiros */}
        <TabsContent value="partners">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar parceiros por nome, CNPJ ou cidade..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button onClick={handleAddPartner}>
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Parceiro
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPartners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => (
                <Card key={partner.id} className={`overflow-hidden ${!partner.ativo ? 'opacity-70' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{partner.nome}</CardTitle>
                      {!partner.ativo && (
                        <Badge variant="outline" className="text-red-500 border-red-500">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{partner.cnpj}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div>
                        <strong>Telefone:</strong> {partner.telefone}
                      </div>
                      <div>
                        <strong>Email:</strong> {partner.email}
                      </div>
                      <div>
                        <strong>Cidade/UF:</strong> {partner.cidade}/{partner.estado}
                      </div>
                      <div>
                        <strong>Contato:</strong> {partner.contato_nome} - {partner.contato_telefone}
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPartner(partner)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePartner(partner)}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum parceiro de guincho cadastrado</p>
              <Button onClick={handleAddPartner} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Parceiro
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de Cadastro/Edição de Parceiro */}
      <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentPartner ? 'Editar Parceiro' : 'Cadastrar Parceiro'}</DialogTitle>
            <DialogDescription>
              {currentPartner 
                ? 'Atualize as informações do parceiro de guincho.' 
                : 'Preencha as informações para cadastrar um novo parceiro de guincho.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(onSubmitPartner)} className="space-y-4">
              <FormField
                control={partnerForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={partnerForm.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={partnerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={partnerForm.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField
                    control={partnerForm.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={partnerForm.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={partnerForm.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="contato_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa de contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={partnerForm.control}
                name="contato_telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPartnerDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentPartner ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Cadastro de Serviço */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Serviço de Guincho</DialogTitle>
            <DialogDescription>
              Preencha as informações para solicitar um serviço de guincho.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(onSubmitService)} className="space-y-4">
              <FormField
                control={serviceForm.control}
                name="parceiro_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parceiro de Guincho</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um parceiro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Selecione um parceiro</SelectItem>
                        {partners
                          .filter(partner => partner.ativo)
                          .map(partner => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.nome}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="placa_veiculo"
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
                  control={serviceForm.control}
                  name="modelo_veiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="Marca/Modelo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={serviceForm.control}
                name="endereco_origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço de Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="Local de retirada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="endereco_destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço de Destino</FormLabel>
                    <FormControl>
                      <Input placeholder="Local de entrega" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="quilometragem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilometragem</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="0.0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Distância em km</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Valor em R$</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={serviceForm.control}
                name="data_servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Serviço</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o serviço" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowServiceDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Solicitar Serviço
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Análise de Status de Serviço */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analisar Solicitação de Guincho</DialogTitle>
            <DialogDescription>
              Atualize o status da solicitação de serviço de guincho.
            </DialogDescription>
          </DialogHeader>
          
          {currentService && (
            <div className="mb-4 p-3 bg-muted rounded-md text-sm">
              <div><strong>Placa:</strong> {currentService.placa_veiculo}</div>
              <div><strong>Modelo:</strong> {currentService.modelo_veiculo}</div>
              <div><strong>Parceiro:</strong> {currentService.parceiro_nome}</div>
              <div><strong>Valor:</strong> {formatCurrency(currentService.valor)}</div>
            </div>
          )}
          
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onSubmitStatus)} className="space-y-4">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value as "pendente" | "aprovado" | "em_analise" | "negado")}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="negado">Negado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {statusForm.watch('status') === 'negado' && (
                <FormField
                  control={statusForm.control}
                  name="motivo_negacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da Negação</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informe o motivo da negação" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowStatusDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atualizar Status
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este parceiro de guincho?
              {currentPartner && (
                <div className="mt-2 font-semibold">{currentPartner.nome}</div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeletePartner}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}