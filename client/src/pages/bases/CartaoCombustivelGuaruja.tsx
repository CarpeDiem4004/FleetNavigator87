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
  provedorCartao: string;
  tipoCombustivel: string;
  horarioAbastecimento: string;
  nomeMotorista: string;
  celularWhatsApp: string;
  projeto: string;
  base: string;
}

const CartaoCombustivelGuaruja: React.FC = () => {
  const [formData, setFormData] = useState<SolicitacaoFormData>({
    placaVeiculo: '',
    quilometragem: '',
    valor: '',
    tipoCartao: 'vinculado',
    placaAutomatic: '',
    provedorCartao: 'Ticket',
    tipoCombustivel: 'Diesel',
    horarioAbastecimento: '',
    nomeMotorista: '',
    celularWhatsApp: '',
    projeto: '',
    base: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [historico, setHistorico] = useState<SolicitacaoHistorico[]>([]);
  const [activeTab, setActiveTab] = useState('nova-solicitacao');
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar histórico de solicitações - simulando dados para demonstração
    const historicoMock: SolicitacaoHistorico[] = [
      {
        id: '1',
        tipoSolicitacao: 'Recarga de Saldo',
        numeroCartao: '1234567890123456',
        placaVeiculo: 'ABC1234',
        nomeMotorista: 'João Silva',
        valorSolicitado: '500.00',
        status: 'aprovado',
        dataSolicitacao: '2025-07-10T09:00:00Z',
        dataResposta: '2025-07-10T14:30:00Z',
        justificativa: 'Necessário para entregas da semana',
        observacoes: 'Urgente para rota SP-RJ',
        observacoesGestao: 'Aprovado conforme cronograma'
      },
      {
        id: '2',
        tipoSolicitacao: 'Novo Cartão',
        numeroCartao: '',
        placaVeiculo: 'XYZ5678',
        nomeMotorista: 'Maria Santos',
        valorSolicitado: '300.00',
        status: 'pendente',
        dataSolicitacao: '2025-07-11T08:15:00Z',
        justificativa: 'Novo funcionário contratado',
        observacoes: 'Primeira solicitação do motorista'
      },
      {
        id: '3',
        tipoSolicitacao: 'Substituição de Cartão',
        numeroCartao: '9876543210987654',
        placaVeiculo: 'DEF9012',
        nomeMotorista: 'Carlos Oliveira',
        valorSolicitado: '200.00',
        status: 'rejeitado',
        dataSolicitacao: '2025-07-09T16:45:00Z',
        dataResposta: '2025-07-10T10:00:00Z',
        justificativa: 'Cartão danificado',
        observacoes: 'Cartão foi danificado em acidente menor',
        observacoesGestao: 'Necessário relatório de ocorrência'
      }
    ];
    setHistorico(historicoMock);
    loadProjectsWithBases();
  }, []);

  const loadProjectsWithBases = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch('/api/public/projects-with-bases', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProjects(data.data);
      } else {
        throw new Error('Dados de projetos inválidos ou vazios');
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error);
      toast({
        title: 'Erro ao carregar projetos',
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({
      ...prev,
      projeto: projectId,
      base: '' // Reset base selection
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desconhecido</Badge>;
    }
  };

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

      if (!formData.projeto || !formData.base) {
        toast({
          title: 'Projeto e Base obrigatórios',
          description: 'Selecione um projeto e uma base',
          variant: 'destructive'
        });
        return;
      }

      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Adicionar nova solicitação ao histórico
      const novaSolicitacao: SolicitacaoHistorico = {
        id: Date.now().toString(),
        tipoSolicitacao: 'Recarga de Saldo',
        numeroCartao: formData.tipoCartao === 'especifico' ? 'Específico' : '',
        placaVeiculo: formData.placaVeiculo,
        nomeMotorista: formData.nomeMotorista,
        valorSolicitado: formData.valor,
        status: 'pendente',
        dataSolicitacao: new Date().toISOString(),
        justificativa: `Solicitação para ${formData.provedorCartao} - ${formData.tipoCombustivel}`,
        observacoes: `Projeto: ${selectedProject?.name || formData.projeto}, Base: ${selectedProject?.bases.find(b => b.id.toString() === formData.base)?.base_name || formData.base}`
      };
      
      setHistorico(prev => [novaSolicitacao, ...prev]);
      setSubmitSuccess(true);
      setShowModal(false);
      
      // Limpar formulário após sucesso
      setTimeout(() => {
        setFormData({
          placaVeiculo: '',
          quilometragem: '',
          valor: '',
          tipoCartao: 'vinculado',
          placaAutomatic: '',
          provedorCartao: 'Ticket',
          tipoCombustivel: 'Diesel',
          horarioAbastecimento: '',
          nomeMotorista: '',
          celularWhatsApp: '',
          projeto: '',
          base: ''
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

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Solicitação Enviada!
              </h2>
              <p className="text-gray-600">
                Sua solicitação de cartão combustível foi enviada com sucesso e está aguardando retorno da gestão de combustível.
              </p>
              <p className="text-sm text-gray-500">
                Você será redirecionado para o histórico automaticamente...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link href="/bases/guaruja">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Base Guarujá
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CreditCard className="h-10 w-10 text-cyan-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Cartão Combustível
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Base Guarujá
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Gestão de Cartão Combustível
            </CardTitle>
            <CardDescription className="text-gray-600">
              Solicite recarga de saldo e acompanhe suas solicitações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nova-solicitacao" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Nova Solicitação
                </TabsTrigger>
                <TabsTrigger value="historico" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico ({historico.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="nova-solicitacao" className="mt-6">
                <div className="flex justify-center">
                  <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg">
                        Nova Solicitação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-blue-600">
                          <CreditCard className="h-5 w-5" />
                          Solicitação de Cartão
                        </DialogTitle>
                        <p className="text-sm text-gray-600">Preencha os dados para solicitar recarga de combustível</p>
                      </DialogHeader>
                      
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Dados da Solicitação
                          </h3>
                          <p className="text-sm text-orange-700 mb-4">Informe os dados do veículo e do cartão desejado</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="placaVeiculo" className="text-red-600 font-medium">
                                🚗 Placa do Veículo
                              </Label>
                              <Input
                                id="placaVeiculo"
                                placeholder="ABC1234"
                                value={formData.placaVeiculo}
                                onChange={(e) => setFormData(prev => ({ ...prev, placaVeiculo: e.target.value }))}
                                className="h-11"
                                required
                              />
                              <p className="text-xs text-gray-500">Informe a placa sem traços ou espaços</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="quilometragem" className="text-gray-700 font-medium">
                                📊 Quilometragem
                              </Label>
                              <Input
                                id="quilometragem"
                                type="number"
                                placeholder="0"
                                value={formData.quilometragem}
                                onChange={(e) => setFormData(prev => ({ ...prev, quilometragem: e.target.value }))}
                                className="h-11"
                              />
                              <p className="text-xs text-gray-500">KM atual do veículo</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="valor" className="text-yellow-600 font-medium">
                                💰 Valor (R$)
                              </Label>
                              <Input
                                id="valor"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={formData.valor}
                                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                                className="h-11"
                                required
                              />
                              <p className="text-xs text-gray-500">Valor em reais para carregar</p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            <Label className="text-gray-700 font-medium">Tipo de Cartão</Label>
                            <RadioGroup 
                              value={formData.tipoCartao} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCartao: value as 'vinculado' | 'especifico' }))}
                              className="space-y-2"
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

                          <div className="mt-4 space-y-2">
                            <Label htmlFor="horarioAbastecimento" className="text-gray-700 font-medium">
                              Horário de Abastecimento
                            </Label>
                            <Select value={formData.horarioAbastecimento} onValueChange={(value) => setFormData(prev => ({ ...prev, horarioAbastecimento: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o horário" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manha">Manhã (6h às 12h)</SelectItem>
                                <SelectItem value="tarde">Tarde (12h às 18h)</SelectItem>
                                <SelectItem value="noite">Noite (18h às 22h)</SelectItem>
                                <SelectItem value="madrugada">Madrugada (22h às 6h)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Escolha o horário preferido para abastecimento</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeMotorista" className="text-yellow-600 font-medium">
                              👤 Nome do Motorista
                            </Label>
                            <Input
                              id="nomeMotorista"
                              placeholder="João da Silva"
                              value={formData.nomeMotorista}
                              onChange={(e) => setFormData(prev => ({ ...prev, nomeMotorista: e.target.value }))}
                              className="h-11"
                              required
                            />
                            <p className="text-xs text-gray-500">Nome completo do motorista</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="celularWhatsApp" className="text-green-600 font-medium">
                              📱 Celular (WhatsApp)
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="projeto" className="text-gray-700 font-medium">
                              Projeto
                            </Label>
                            {isLoadingProjects ? (
                              <div className="flex items-center justify-center h-11 border rounded">
                                <span className="text-sm text-gray-500">Carregando projetos...</span>
                              </div>
                            ) : (
                              <Select value={formData.projeto} onValueChange={handleProjectChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o projeto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="base" className="text-gray-700 font-medium">
                              Base
                            </Label>
                            <Select 
                              value={formData.base} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, base: value }))}
                              disabled={!selectedProject || selectedProject.bases.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  selectedProject ? 
                                    `Selecione entre ${selectedProject.bases.length} bases` : 
                                    "Primeiro selecione um projeto"
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedProject?.bases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Clique no botão acima para abrir o formulário de solicitação
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Solicitações</h3>
                    <Badge variant="outline" className="text-cyan-600">
                      {historico.length} solicitações
                    </Badge>
                  </div>
                  
                  {historico.length === 0 ? (
                    <Card className="border-2 border-dashed border-gray-200">
                      <CardContent className="pt-6">
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium">Nenhuma solicitação encontrada</p>
                          <p className="text-sm">Suas solicitações de cartão combustível aparecerão aqui</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {historico.map((solicitacao) => (
                        <Card key={solicitacao.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-100 rounded-lg">
                                  <CreditCard className="h-5 w-5 text-cyan-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{solicitacao.tipoSolicitacao}</h4>
                                  <p className="text-sm text-gray-500">ID: {solicitacao.id}</p>
                                </div>
                              </div>
                              {getStatusBadge(solicitacao.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Placa: {solicitacao.placaVeiculo}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Motorista: {solicitacao.nomeMotorista}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Valor: R$ {solicitacao.valorSolicitado}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Solicitação: {formatDate(solicitacao.dataSolicitacao)}</span>
                              </div>
                              {solicitacao.dataResposta && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Resposta: {formatDate(solicitacao.dataResposta)}</span>
                                </div>
                              )}
                              {solicitacao.numeroCartao && (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">Cartão: ****{solicitacao.numeroCartao.slice(-4)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium text-gray-700">Justificativa:</span>
                                <p className="text-sm text-gray-600 mt-1">{solicitacao.justificativa}</p>
                              </div>
                              {solicitacao.observacoes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Observações:</span>
                                  <p className="text-sm text-gray-600 mt-1">{solicitacao.observacoes}</p>
                                </div>
                              )}
                              {solicitacao.observacoesGestao && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Observações da Gestão:</span>
                                  <p className="text-sm text-gray-600 mt-1">{solicitacao.observacoesGestao}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartaoCombustivelGuaruja;