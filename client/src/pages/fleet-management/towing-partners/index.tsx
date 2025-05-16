import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Truck,
  Plus,
  Search,
  FileDown,
  FileUp,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Interfaces
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

// Schemas para validação de formulários
const towingPartnerSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().optional(),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
  estado: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  cep: z.string().optional(),
  contato_nome: z.string().min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  contato_telefone: z.string().min(10, "Telefone do contato deve ter pelo menos 10 dígitos"),
  ativo: z.boolean().default(true),
});

const towingServiceSchema = z.object({
  parceiro_id: z.number().min(1, "Selecione um parceiro"),
  placa_veiculo: z.string().min(7, "Placa do veículo é obrigatória"),
  modelo_veiculo: z.string().min(2, "Modelo do veículo é obrigatório"),
  endereco_origem: z.string().min(5, "Endereço de origem é obrigatório"),
  endereco_destino: z.string().min(5, "Endereço de destino é obrigatório"),
  quilometragem: z.number().min(0, "Quilometragem deve ser um número positivo"),
  valor: z.number().min(0, "Valor deve ser um número positivo"),
  data_servico: z.string().min(1, "Data do serviço é obrigatória"),
  observacoes: z.string().optional(),
});

const serviceStatusSchema = z.object({
  status: z.enum(["aprovado", "em_analise", "negado"]),
  motivo_negacao: z.string().optional(),
});

export default function TowingPartners() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('partners');
  const [isNewPartnerDialogOpen, setIsNewPartnerDialogOpen] = useState(false);
  const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<TowingPartner | null>(null);
  const [selectedService, setSelectedService] = useState<TowingService | null>(null);
  const [filteredPartners, setFilteredPartners] = useState<TowingPartner[]>([]);
  const [filteredServices, setFilteredServices] = useState<TowingService[]>([]);

  // Formulário de cadastro de parceiro
  const partnerForm = useForm<z.infer<typeof towingPartnerSchema>>({
    resolver: zodResolver(towingPartnerSchema),
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
      contato_telefone: '',
      ativo: true,
    },
  });

  // Formulário de cadastro de serviço
  const serviceForm = useForm<z.infer<typeof towingServiceSchema>>({
    resolver: zodResolver(towingServiceSchema),
    defaultValues: {
      parceiro_id: 0,
      placa_veiculo: '',
      modelo_veiculo: '',
      endereco_origem: '',
      endereco_destino: '',
      quilometragem: 0,
      valor: 0,
      data_servico: format(new Date(), 'yyyy-MM-dd'),
      observacoes: '',
    },
  });

  // Formulário de atualização de status
  const statusForm = useForm<z.infer<typeof serviceStatusSchema>>({
    resolver: zodResolver(serviceStatusSchema),
    defaultValues: {
      status: 'em_analise',
      motivo_negacao: '',
    },
  });

  // Buscar parceiros
  const {
    data: partners = [],
    isLoading: isLoadingPartners,
    error: partnersError,
    refetch: refetchPartners,
  } = useQuery<TowingPartner[]>({
    queryKey: ['/api/frota/parceiros-guincho'],
    enabled: true,
  });

  // Buscar serviços
  const {
    data: services = [],
    isLoading: isLoadingServices,
    error: servicesError,
    refetch: refetchServices,
  } = useQuery<TowingService[]>({
    queryKey: ['/api/frota/servicos-guincho'],
    enabled: true,
  });

  // Filtrar parceiros com base no termo de pesquisa
  useEffect(() => {
    if (partners.length > 0) {
      if (searchTerm) {
        const filtered = partners.filter(partner => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (partner.nome && partner.nome.toLowerCase().includes(searchLower)) ||
            (partner.cnpj && partner.cnpj.toLowerCase().includes(searchLower)) ||
            (partner.cidade && partner.cidade.toLowerCase().includes(searchLower))
          );
        });
        setFilteredPartners(filtered);
      } else {
        setFilteredPartners(partners);
      }
    } else {
      setFilteredPartners([]);
    }
  }, [searchTerm, partners]);

  // Filtrar serviços com base no termo de pesquisa
  useEffect(() => {
    if (services.length > 0) {
      if (searchTerm) {
        const filtered = services.filter(service => {
          const searchLower = searchTerm.toLowerCase();
          const partnerName = partners.find(p => p.id === service.parceiro_id)?.nome || '';
          return (
            service.placa_veiculo.toLowerCase().includes(searchLower) ||
            (service.modelo_veiculo && service.modelo_veiculo.toLowerCase().includes(searchLower)) ||
            partnerName.toLowerCase().includes(searchLower)
          );
        });
        setFilteredServices(filtered);
      } else {
        setFilteredServices(services);
      }
    } else {
      setFilteredServices([]);
    }
  }, [searchTerm, services, partners]);

  // Manipular cadastro de novo parceiro
  const handlePartnerSubmit = async (data: z.infer<typeof towingPartnerSchema>) => {
    try {
      const response = await apiRequest('POST', '/api/frota/parceiros-guincho', data);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Parceiro cadastrado com sucesso!',
          description: `O parceiro ${result.nome} foi cadastrado.`,
          variant: 'default',
        });
        setIsNewPartnerDialogOpen(false);
        partnerForm.reset();
        queryClient.invalidateQueries({ queryKey: ['/api/frota/parceiros-guincho'] });
      } else {
        throw new Error(result.message || 'Erro ao cadastrar parceiro');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar parceiro',
        description: error.message || 'Ocorreu um erro ao cadastrar o parceiro',
        variant: 'destructive',
      });
    }
  };

  // Manipular cadastro de novo serviço
  const handleServiceSubmit = async (data: z.infer<typeof towingServiceSchema>) => {
    try {
      const response = await apiRequest('POST', '/api/frota/servicos-guincho', data);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Serviço cadastrado com sucesso!',
          description: `O serviço foi cadastrado e está aguardando aprovação.`,
          variant: 'default',
        });
        setIsNewServiceDialogOpen(false);
        serviceForm.reset();
        queryClient.invalidateQueries({ queryKey: ['/api/frota/servicos-guincho'] });
      } else {
        throw new Error(result.message || 'Erro ao cadastrar serviço');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao cadastrar serviço',
        description: error.message || 'Ocorreu um erro ao cadastrar o serviço',
        variant: 'destructive',
      });
    }
  };

  // Manipular atualização de status
  const handleStatusUpdate = async (data: z.infer<typeof serviceStatusSchema>) => {
    if (!selectedService) return;

    try {
      const response = await apiRequest('PATCH', `/api/frota/servicos-guincho/${selectedService.id}/status`, data);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Status atualizado com sucesso!',
          description: `O serviço agora está ${data.status === 'aprovado' ? 'aprovado' : data.status === 'em_analise' ? 'em análise' : 'negado'}.`,
          variant: 'default',
        });
        setIsStatusDialogOpen(false);
        statusForm.reset();
        queryClient.invalidateQueries({ queryKey: ['/api/frota/servicos-guincho'] });
      } else {
        throw new Error(result.message || 'Erro ao atualizar status');
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Ocorreu um erro ao atualizar o status do serviço',
        variant: 'destructive',
      });
    }
  };

  // Manipulador para abrir o diálogo de status
  const handleOpenStatusDialog = (service: TowingService) => {
    setSelectedService(service);
    statusForm.reset({
      status: service.status === 'pendente' ? 'em_analise' : service.status,
      motivo_negacao: service.motivo_negacao || '',
    });
    setIsStatusDialogOpen(true);
  };

  // Função para obter o nome do parceiro pelo ID
  const getPartnerName = (partnerId: number) => {
    return partners.find(p => p.id === partnerId)?.nome || 'Parceiro não encontrado';
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="success" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Aprovado</Badge>;
      case 'negado':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Negado</Badge>;
      case 'em_analise':
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><AlertCircle className="h-3 w-3 mr-1" /> Em análise</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
    }
  };

  // Renderização do componente
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Truck className="mr-2 h-8 w-8" />
                Parceiros de Guincho
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerenciamento de parceiros e serviços de guincho
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {
                serviceForm.reset();
                setIsNewServiceDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
              <Button onClick={() => {
                partnerForm.reset();
                setIsNewPartnerDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Parceiro
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="partners" onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="partners">Parceiros</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
            </TabsList>
            
            {/* Tab de Parceiros */}
            <TabsContent value="partners">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Lista de Parceiros</CardTitle>
                  <CardDescription>
                    Empresas parceiras que prestam serviços de guincho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPartners ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : partnersError ? (
                    <div className="py-8 text-center">
                      <p className="text-red-500">Erro ao carregar parceiros</p>
                      <Button variant="outline" className="mt-2" onClick={() => refetchPartners()}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : filteredPartners.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cidade/UF</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartners.map((partner) => (
                          <TableRow key={partner.id}>
                            <TableCell className="font-medium">{partner.nome}</TableCell>
                            <TableCell>{partner.cnpj || '-'}</TableCell>
                            <TableCell>{partner.telefone}</TableCell>
                            <TableCell>{partner.cidade}/{partner.estado}</TableCell>
                            <TableCell>{partner.contato_nome}</TableCell>
                            <TableCell>
                              {partner.ativo ? (
                                <Badge variant="success" className="bg-green-500">Ativo</Badge>
                              ) : (
                                <Badge variant="destructive">Inativo</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Implementar edição de parceiro
                                    setSelectedPartner(partner);
                                    // setIsEditPartnerDialogOpen(true);
                                    toast({
                                      title: "Funcionalidade em desenvolvimento",
                                      description: "A edição de parceiros será implementada em breve.",
                                      variant: "default",
                                    });
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab de Serviços */}
            <TabsContent value="services">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Serviços de Guincho</CardTitle>
                  <CardDescription>
                    Gerenciamento de serviços prestados pelos parceiros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingServices ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : servicesError ? (
                    <div className="py-8 text-center">
                      <p className="text-red-500">Erro ao carregar serviços</p>
                      <Button variant="outline" className="mt-2" onClick={() => refetchServices()}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Nenhum serviço encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parceiro</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Quilometragem</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{getPartnerName(service.parceiro_id)}</TableCell>
                            <TableCell>{service.placa_veiculo}</TableCell>
                            <TableCell>{service.modelo_veiculo}</TableCell>
                            <TableCell>{format(new Date(service.data_servico), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{service.quilometragem} km</TableCell>
                            <TableCell>R$ {service.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell>{renderStatusBadge(service.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenStatusDialog(service)}
                                >
                                  {service.status === 'pendente' ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Aprovar
                                    </>
                                  ) : (
                                    <>
                                      <Pencil className="h-4 w-4 mr-1" />
                                      Atualizar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Diálogo para cadastro de novo parceiro */}
      <Dialog open={isNewPartnerDialogOpen} onOpenChange={setIsNewPartnerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Parceiro de Guincho</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo parceiro de serviços de guincho.
            </DialogDescription>
          </DialogHeader>
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(handlePartnerSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partnerForm.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={partnerForm.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </div>
                <FormField
                  control={partnerForm.control}
                  name="contato_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewPartnerDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar Parceiro</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para cadastro de novo serviço */}
      <Dialog open={isNewServiceDialogOpen} onOpenChange={setIsNewServiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Serviço de Guincho</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo serviço de guincho.
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="parceiro_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Parceiro</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um parceiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={serviceForm.control}
                  name="endereco_origem"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço de Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Local onde o veículo foi coletado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="endereco_destino"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço de Destino</FormLabel>
                      <FormControl>
                        <Input placeholder="Local onde o veículo foi entregue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="quilometragem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quilometragem</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Distância percorrida (km)" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Serviço</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Valor (R$)" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="data_servico"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
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
                    <FormItem className="col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Informações adicionais sobre o serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewServiceDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar Serviço</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para atualizar status do serviço */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Status do Serviço</DialogTitle>
            <DialogDescription>
              Altere o status do serviço de guincho.
            </DialogDescription>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(handleStatusUpdate)} className="space-y-4">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="em_analise">Em análise</SelectItem>
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
                        <Textarea placeholder="Informe o motivo da negação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Atualizar Status</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}