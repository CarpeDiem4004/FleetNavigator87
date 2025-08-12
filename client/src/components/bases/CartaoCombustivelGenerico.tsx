import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, ArrowLeft, CheckCircle, History, FileText, Calendar, DollarSign, Clock, User, Car, X } from "lucide-react";
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import BaseAccessController from '@/components/permission/BaseAccessController';

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
  basename?: string;
  operation: string;
}

interface SolicitacaoHistorico {
  id: string;
  tipoSolicitacao: string;
  numeroCartao: string;
  placaVeiculo: string;
  nomeMotorista: string;
  valorSolicitado: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataSolicitacao: string;
  dataResposta?: string;
  justificativa: string;
  observacoes?: string;
  observacoesGestao?: string;
}

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

interface SolicitacaoFormData {
  placaVeiculo: string;
  quilometragem: string;
  valor: string;
  tipoCartao: 'vinculado' | 'especifico';
  placaAutomatic: string;
  numeroCartaoEspecifico?: string;
  observacoesCartao?: string;
  provedorCartao: string;
  tipoCombustivel: string;
  horarioAbastecimento: string;
  nomeMotorista: string;
  nomeSolicitante: string;
  celularWhatsApp: string;
  projeto: string;
  base: string;
}

interface CartaoCombustivelGenericoProps {
  baseId: string | number;
}

function CartaoCombustivelGenericoContent({ baseId }: CartaoCombustivelGenericoProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitacao');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filteredBases, setFilteredBases] = useState<ProjectBase[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [historico, setHistorico] = useState<SolicitacaoHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const [formData, setFormData] = useState<SolicitacaoFormData>({
    placaVeiculo: '',
    quilometragem: '',
    valor: '',
    tipoCartao: 'vinculado',
    placaAutomatic: '',
    numeroCartaoEspecifico: '',
    observacoesCartao: '',
    provedorCartao: 'Ticket',
    tipoCombustivel: 'Diesel',
    horarioAbastecimento: '',
    nomeMotorista: '',
    nomeSolicitante: '',
    celularWhatsApp: '',
    projeto: '',
    base: ''
  });

  // Carregar informações da base
  useEffect(() => {
    const fetchBaseInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bases/${baseId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setBaseInfo(data.data);
        }
      } catch (err) {
        console.error('Erro ao buscar informações da base:', err);
        toast({
          title: 'Erro ao carregar base',
          description: 'Não foi possível carregar informações da base',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (baseId) {
      fetchBaseInfo();
    }
  }, [baseId, toast]);

  // Carregar histórico de solicitações
  const loadFuelCardHistory = async () => {
    try {
      setLoadingHistorico(true);
      // Simular carregamento de histórico
      // Em produção, fazer chamada real para a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHistorico([]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Preencher dados do usuário automaticamente
  useEffect(() => {
    const fetchBaseUserData = async () => {
      try {
        if (user && user.name) {
          console.log('Usando dados do usuário do contexto:', user);
          const cleanName = user.name.trim();
          setFormData(prev => ({ 
            ...prev, 
            nomeSolicitante: cleanName 
          }));
          return;
        }
        
        console.warn('Nenhum dado de usuário encontrado para preencher automaticamente');
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };
    
    fetchBaseUserData();
    loadFuelCardHistory();
  }, [user]);

  // Atualizar histórico a cada 10 segundos para mostrar mudanças de status
  useEffect(() => {
    const interval = setInterval(() => {
      loadFuelCardHistory();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Carregar projetos baseado na base atual
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/project-bases');
        const result = await response.json();
        console.log('Resposta da API projetos:', result);
        
        const projectsData = result.data || result;
        console.log('Dados dos projetos:', projectsData);
        
        if (Array.isArray(projectsData)) {
          setProjects(projectsData);
          
          // Buscar automaticamente o projeto associado à base atual
          if (baseInfo) {
            const baseProjects = projectsData.filter((p: any) => 
              p.base_id === baseInfo.id || 
              p.base_name === baseInfo.name ||
              (baseInfo.basename && p.base_code === baseInfo.basename)
            );
            
            if (baseProjects.length > 0) {
              const firstProject = baseProjects[0];
              console.log('Selecionando automaticamente projeto da base:', firstProject);
              setFormData(prev => ({ 
                ...prev, 
                projeto: firstProject.project_id.toString(),
                base: firstProject.base_id.toString()
              }));
              
              // Configurar projeto selecionado
              const groupedProject = {
                id: firstProject.project_id,
                name: firstProject.project_name,
                bases: projectsData
                  .filter((p: any) => p.project_id === firstProject.project_id)
                  .map((item: any) => ({
                    id: item.base_id,
                    base_name: item.base_name,
                    base_code: item.base_code
                  }))
              };
              setSelectedProject(groupedProject);
              setFilteredBases(groupedProject.bases);
            }
          }
        } else {
          console.error('Dados dos projetos não são um array:', projectsData);
          setProjects([]);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        setProjects([]);
        toast({
          title: 'Erro ao carregar projetos',
          description: 'Não foi possível carregar a lista de projetos',
          variant: 'destructive'
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    if (baseInfo) {
      fetchProjects();
    }
  }, [baseInfo, toast]);

  // Definir projeto e base fixos baseado na base atual
  useEffect(() => {
    if (baseInfo) {
      // Definir valores fixos baseados na base atual
      const projetoFixo = "MERCADO LIVRE";
      const baseFixa = baseInfo.name;
      
      // Atualizar formData com valores fixos
      setFormData(prev => ({
        ...prev,
        projeto: "1", // ID fixo para Mercado Livre
        base: baseInfo.id.toString()
      }));
      
      // Definir projeto selecionado
      setSelectedProject({
        id: 1,
        name: projetoFixo,
        bases: [{
          id: baseInfo.id,
          base_name: baseInfo.name,
          base_code: baseInfo.code || ''
        }]
      });
    }
  }, [baseInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validações básicas
      if (!formData.placaVeiculo || !formData.nomeMotorista || !formData.valor) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha placa, motorista e valor',
          variant: 'destructive'
        });
        return;
      }

      // Validação para cartão específico
      if (formData.tipoCartao === 'especifico' && !formData.numeroCartaoEspecifico) {
        toast({
          title: 'Número do cartão obrigatório',
          description: 'Informe o número do cartão específico',
          variant: 'destructive'
        });
        return;
      }

      if (!formData.projeto || !formData.base) {
        toast({
          title: 'Projeto e Base obrigatórios',
          description: 'Selecione um projeto e uma base',
          variant: 'destructive'
        });
        return;
      }

      // Enviar solicitação para API
      const requestData = {
        plate: formData.placaVeiculo,
        odometer: formData.quilometragem,
        amount: parseFloat(formData.valor),
        cardType: formData.tipoCartao,
        cardNumber: formData.tipoCartao === 'especifico' ? formData.numeroCartaoEspecifico : formData.placaVeiculo,
        provider: formData.provedorCartao,
        fuelType: formData.tipoCombustivel,
        fuelTime: formData.horarioAbastecimento,
        driverName: formData.nomeMotorista,
        requesterName: formData.nomeSolicitante,
        driverPhone: formData.celularWhatsApp,
        projectId: parseInt(formData.projeto),
        baseId: parseInt(formData.base),
        observations: formData.observacoesCartao,
        requestDate: new Date().toISOString(),
        status: 'pendente'
      };

      console.log('Enviando solicitação de cartão combustível:', requestData);

      const response = await fetch('/api/fuel-card-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resposta da API:', result);

      setSubmitSuccess(true);
      setShowModal(false);
      
      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação foi enviada com sucesso!',
        variant: 'default'
      });

      // Recarregar histórico
      loadFuelCardHistory();

      // Resetar formulário após 3 segundos
      setTimeout(() => {
        const currentUserName = user?.name || '';
        
        setFormData({
          placaVeiculo: '',
          quilometragem: '',
          valor: '',
          tipoCartao: 'vinculado',
          placaAutomatic: '',
          numeroCartaoEspecifico: '',
          observacoesCartao: '',
          provedorCartao: 'Ticket',
          tipoCombustivel: 'Diesel',
          horarioAbastecimento: '',
          nomeMotorista: '',
          nomeSolicitante: currentUserName,
          celularWhatsApp: '',
          projeto: selectedProject?.id.toString() || '',
          base: baseInfo?.id.toString() || ''
        });
        setSubmitSuccess(false);
        setActiveTab('historico');
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível enviar a solicitação',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Pendente</Badge>;
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = parseFloat(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!baseInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Base não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Cartão Combustível</h1>
              <p className="text-gray-600">{baseInfo.name} • {baseInfo.operation}</p>
            </div>
            <Link href={`/bases/${baseInfo.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        {/* Alert de sucesso */}
        {submitSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Solicitação enviada com sucesso! Sua solicitação foi enviada e está aguardando retorno da gestão de combustível.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="solicitacao" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Nova Solicitação
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Nova Solicitação */}
          <TabsContent value="solicitacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Solicitar Recarga de Cartão
                </CardTitle>
                <CardDescription>
                  Preencha os dados para solicitar recarga de saldo no cartão combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Solicitar Recarga
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Solicitação de Recarga - {baseInfo.name}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Dados da Solicitação
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">Informe os dados do veículo e do cartão desejado</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="placaVeiculo" className="text-red-600 font-medium">
                              🚗 Placa do Veículo
                            </Label>
                            <Input
                              id="placaVeiculo"
                              placeholder="ABC-1234"
                              value={formData.placaVeiculo}
                              onChange={(e) => setFormData(prev => ({ ...prev, placaVeiculo: e.target.value.toUpperCase() }))}
                              className="h-11"
                              required
                            />
                            <p className="text-xs text-gray-500">Placa do veículo para abastecimento</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="quilometragem" className="text-purple-600 font-medium">
                              📏 Quilometragem
                            </Label>
                            <Input
                              id="quilometragem"
                              placeholder="123456"
                              type="number"
                              value={formData.quilometragem}
                              onChange={(e) => setFormData(prev => ({ ...prev, quilometragem: e.target.value }))}
                              className="h-11"
                            />
                            <p className="text-xs text-gray-500">Quilometragem atual do veículo</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nomeMotorista" className="text-blue-600 font-medium">
                              👤 Nome do Motorista
                            </Label>
                            <Input
                              id="nomeMotorista"
                              placeholder="Nome completo"
                              value={formData.nomeMotorista}
                              onChange={(e) => setFormData(prev => ({ ...prev, nomeMotorista: e.target.value }))}
                              className="h-11"
                              required
                            />
                            <p className="text-xs text-gray-500">Nome do motorista responsável</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="valor" className="text-green-600 font-medium">
                              💰 Valor da Recarga (R$)
                            </Label>
                            <Input
                              id="valor"
                              placeholder="100.00"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.valor}
                              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                              className="h-11"
                              required
                            />
                            <p className="text-xs text-gray-500">Valor da recarga solicitada</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-blue-600 font-medium">Tipo de Cartão</Label>
                            <RadioGroup
                              value={formData.tipoCartao}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCartao: value as 'vinculado' | 'especifico' }))}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="vinculado" id="vinculado" />
                                <Label htmlFor="vinculado" className="text-sm">
                                  🔗 Cartão vinculado à placa do veículo
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="especifico" id="especifico" />
                                <Label htmlFor="especifico" className="text-sm">
                                  🎯 Cartão específico por número
                                </Label>
                              </div>
                            </RadioGroup>

                            {formData.tipoCartao === 'vinculado' && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <Label htmlFor="placaAutomatic" className="text-blue-600 font-medium">
                                  🚗 Placa do Veículo (Cartão)
                                </Label>
                                <Input
                                  id="placaAutomatic"
                                  placeholder="Placa será usada automaticamente"
                                  value={formData.placaVeiculo}
                                  disabled
                                  className="h-11 mt-2 bg-white"
                                />
                                <p className="text-xs text-blue-600 mt-1">
                                  Para cartão vinculado, a placa do veículo será usada automaticamente
                                </p>
                              </div>
                            )}

                            {formData.tipoCartao === 'especifico' && (
                              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                                <div>
                                  <Label htmlFor="numeroCartaoEspecifico" className="text-orange-600 font-medium">
                                    🎯 Placa do Cartão Específico
                                  </Label>
                                  <Input
                                    id="numeroCartaoEspecifico"
                                    placeholder="PLACA DO CARTAO"
                                    value={formData.numeroCartaoEspecifico || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, numeroCartaoEspecifico: e.target.value.toUpperCase() }))}
                                    className="h-11 mt-2"
                                    required
                                  />
                                  <p className="text-xs text-orange-600 mt-1">
                                    Informe o número do cartão específico para abastecimento
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="provedorCartao" className="text-gray-700 font-medium">
                                Provedor do Cartão
                              </Label>
                              <Select value={formData.provedorCartao} onValueChange={(value) => setFormData(prev => ({ ...prev, provedorCartao: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ticket">Ticket</SelectItem>
                                  <SelectItem value="Alelo">Alelo</SelectItem>
                                  <SelectItem value="VR">VR</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">Empresa que fornece o cartão de combustível</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="tipoCombustivel" className="text-gray-700 font-medium">
                                Tipo de Combustível
                              </Label>
                              <Select value={formData.tipoCombustivel} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCombustivel: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Diesel">Diesel</SelectItem>
                                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                                  <SelectItem value="Etanol">Etanol</SelectItem>
                                  <SelectItem value="GNV">GNV</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">Tipo de combustível para o veículo</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Dados do Solicitante
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeSolicitante" className="text-yellow-600 font-medium">
                              Nome
                            </Label>
                            <Input
                              id="nomeSolicitante"
                              placeholder="Nome será preenchido automaticamente"
                              value={formData.nomeSolicitante}
                              disabled
                              className="h-11 bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">Nome do solicitante (preenchido automaticamente)</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="celularWhatsApp" className="text-green-600 font-medium">
                              Telefone
                            </Label>
                            <Input
                              id="celularWhatsApp"
                              placeholder="(11) 99999-9999"
                              value={formData.celularWhatsApp}
                              onChange={(e) => setFormData(prev => ({ ...prev, celularWhatsApp: e.target.value }))}
                              className="h-11"
                            />
                            <p className="text-xs text-gray-500">Para receber notificação quando aprovado</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="horarioAbastecimento" className="text-gray-700 font-medium">
                            Horário de Abastecimento
                          </Label>
                          <Select value={formData.horarioAbastecimento} onValueChange={(value) => setFormData(prev => ({ ...prev, horarioAbastecimento: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o horário" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="antes-17h">Antes das 17h</SelectItem>
                              <SelectItem value="apos-18h">Após as 18h</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">Período em que pretende abastecer</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Projeto e Base
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="projeto" className="text-gray-700 font-medium">
                              Projeto
                            </Label>
                            <Input
                              id="projeto"
                              value={selectedProject ? selectedProject.name : (loadingProjects ? "Carregando..." : "MERCADO LIVRE")}
                              disabled
                              className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Projeto fixo da base operacional</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="base" className="text-gray-700 font-medium">
                              Base
                            </Label>
                            <Input
                              id="base"
                              value={baseInfo ? baseInfo.name : "Carregando..."}
                              disabled
                              className="bg-gray-100 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">Base operacional fixa</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="observacoesCartao" className="text-gray-700 font-medium">
                            Observações Adicionais
                          </Label>
                          <Textarea
                            id="observacoesCartao"
                            placeholder="Informações adicionais sobre a solicitação..."
                            value={formData.observacoesCartao}
                            onChange={(e) => setFormData(prev => ({ ...prev, observacoesCartao: e.target.value }))}
                            className="min-h-[80px]"
                          />
                          <p className="text-xs text-gray-500">Detalhes extras que julgar necessário</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700">
                          {isSubmitting ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Enviar Solicitação
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Solicitações
                </CardTitle>
                <CardDescription>
                  Acompanhe o status das suas solicitações de cartão combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistorico ? (
                  <div className="text-center py-8">
                    <div className="h-6 w-6 animate-spin mx-auto mb-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="text-gray-600">Carregando histórico...</p>
                  </div>
                ) : historico.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma solicitação encontrada</p>
                    <p className="text-sm text-gray-500">Suas solicitações aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historico.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{item.placaVeiculo}</span>
                            {getStatusBadge(item.status)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(item.dataSolicitacao)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Motorista:</span>
                            <p className="font-medium">{item.nomeMotorista}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor:</span>
                            <p className="font-medium">{formatCurrency(item.valorSolicitado)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Cartão:</span>
                            <p className="font-medium">{item.numeroCartao}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium">{item.tipoSolicitacao}</p>
                          </div>
                        </div>

                        {item.justificativa && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <span className="text-gray-500 text-sm">Justificativa:</span>
                            <p className="text-sm">{item.justificativa}</p>
                          </div>
                        )}

                        {item.observacoesGestao && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <span className="text-blue-600 text-sm font-medium">Observações da Gestão:</span>
                            <p className="text-sm text-blue-800">{item.observacoesGestao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Wrapper principal com controle de acesso baseado na regra de ouro
export default function CartaoCombustivelGenerico({ baseId }: CartaoCombustivelGenericoProps) {
  return (
    <BaseAccessController baseId={baseId}>
      <CartaoCombustivelGenericoContent baseId={baseId} />
    </BaseAccessController>
  );
}