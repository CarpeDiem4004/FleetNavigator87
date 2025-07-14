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

export default function CartaoCombustivelGP02() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('solicitacao');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filteredBases, setFilteredBases] = useState<ProjectBase[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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

  const [historico, setHistorico] = useState<SolicitacaoHistorico[]>([
    {
      id: '1',
      tipoSolicitacao: 'Recarga de Saldo',
      numeroCartao: 'Vinculado à Placa',
      placaVeiculo: 'DEF5678',
      nomeMotorista: 'Carlos Lima',
      valorSolicitado: '180.00',
      status: 'aprovado',
      dataSolicitacao: '2025-07-10T08:00:00Z',
      dataResposta: '2025-07-10T12:30:00Z',
      justificativa: 'Abastecimento para rota Jacarei',
      observacoes: 'Projeto: GRUPO PEREIRA, Base: GP02 - Jacarei',
      observacoesGestao: 'Aprovado conforme programação'
    },
    {
      id: '2',
      tipoSolicitacao: 'Recarga de Saldo',
      numeroCartao: 'Específico',
      placaVeiculo: 'GHI9012',
      nomeMotorista: 'Ana Costa',
      valorSolicitado: '220.00',
      status: 'pendente',
      dataSolicitacao: '2025-07-13T07:30:00Z',
      justificativa: 'Viagem programada',
      observacoes: 'Projeto: GRUPO PEREIRA, Base: GP02 - Jacarei'
    }
  ]);

  // Carregar projetos
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/project-bases');
        const data = await response.json();
        console.log('Projetos carregados:', data);
        setProjects(data);
        
        // Filtrar automaticamente para o projeto GRUPO PEREIRA
        const grupoPereiraProject = data.find((p: Project) => p.name === 'GRUPO PEREIRA');
        if (grupoPereiraProject) {
          setSelectedProject(grupoPereiraProject);
          setFilteredBases(grupoPereiraProject.bases);
          setFormData(prev => ({ ...prev, projeto: grupoPereiraProject.id.toString() }));
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        toast({
          title: 'Erro ao carregar projetos',
          description: 'Não foi possível carregar a lista de projetos',
          variant: 'destructive'
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [toast]);

  // Filtrar bases baseado no projeto selecionado
  useEffect(() => {
    if (formData.projeto) {
      const project = projects.find(p => p.id.toString() === formData.projeto);
      if (project) {
        setSelectedProject(project);
        setFilteredBases(project.bases);
        setFormData(prev => ({ ...prev, base: '' }));
      }
    } else {
      setFilteredBases([]);
    }
  }, [formData.projeto, projects]);

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
        numeroCartao: formData.tipoCartao === 'especifico' ? 'Específico' : 'Vinculado à Placa',
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
          projeto: selectedProject?.id.toString() || '',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Cartão Combustível</h1>
              <p className="text-gray-600">Base GP02 - Jacarei • Grupo Pereira</p>
            </div>
            <Link href="/bases/gp02/external">
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
                        Solicitação de Recarga - GP02 Jacarei
                      </DialogTitle>
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
                                <Label htmlFor="vinculado">Cartão vinculado à placa do veículo</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="especifico" id="especifico" />
                                <Label htmlFor="especifico">Cartão específico por número</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-green-600 font-medium">Provedor do Cartão</Label>
                              <Select value={formData.provedorCartao} onValueChange={(value) => setFormData(prev => ({ ...prev, provedorCartao: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o provedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Ticket">Ticket</SelectItem>
                                  <SelectItem value="Alelo">Alelo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-purple-600 font-medium">Tipo de Combustível</Label>
                              <Select value={formData.tipoCombustivel} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCombustivel: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o combustível" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Diesel">Diesel</SelectItem>
                                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                                  <SelectItem value="Etanol">Etanol</SelectItem>
                                  <SelectItem value="Arla 32">Arla 32</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Dados do Motorista
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomeMotorista" className="text-gray-700 font-medium">
                              👤 Nome do Motorista
                            </Label>
                            <Input
                              id="nomeMotorista"
                              placeholder="Nome completo do motorista"
                              value={formData.nomeMotorista}
                              onChange={(e) => setFormData(prev => ({ ...prev, nomeMotorista: e.target.value }))}
                              className="h-11"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="celularWhatsApp" className="text-gray-700 font-medium">
                              📱 Celular/WhatsApp
                            </Label>
                            <Input
                              id="celularWhatsApp"
                              placeholder="(11) 99999-9999"
                              value={formData.celularWhatsApp}
                              onChange={(e) => setFormData(prev => ({ ...prev, celularWhatsApp: e.target.value }))}
                              className="h-11"
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label className="text-gray-700 font-medium">Horário de Abastecimento</Label>
                          <Select value={formData.horarioAbastecimento} onValueChange={(value) => setFormData(prev => ({ ...prev, horarioAbastecimento: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o horário preferido" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Antes das 17h">Antes das 17h</SelectItem>
                              <SelectItem value="Após as 18h">Após as 18h</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Projeto e Base
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Projeto</Label>
                            <Select 
                              value={formData.projeto} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, projeto: value }))}
                              disabled={loadingProjects}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingProjects ? "Carregando..." : "Selecione o projeto"} />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id.toString()}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700 font-medium">Base</Label>
                            <Select 
                              value={formData.base} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, base: value }))}
                              disabled={filteredBases.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={filteredBases.length === 0 ? "Selecione um projeto primeiro" : "Selecione a base"} />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredBases.map((base) => (
                                  <SelectItem key={base.id} value={base.id.toString()}>
                                    {base.base_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowModal(false)}
                          disabled={isSubmitting}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-cyan-600 hover:bg-cyan-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Enviando...' : 'Solicitar Recarga'}
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
                  Acompanhe suas solicitações de recarga de cartão combustível
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historico.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-cyan-600" />
                            <div>
                              <h4 className="font-medium">{item.tipoSolicitacao}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(item.dataSolicitacao)}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Placa:</span>
                            <p className="text-gray-600">{item.placaVeiculo}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Motorista:</span>
                            <p className="text-gray-600">{item.nomeMotorista}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Valor:</span>
                            <p className="text-gray-600">{formatCurrency(item.valorSolicitado)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Cartão:</span>
                            <p className="text-gray-600">{item.numeroCartao}</p>
                          </div>
                        </div>
                        
                        {item.justificativa && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <span className="font-medium text-blue-800">Justificativa:</span>
                            <p className="text-blue-700 text-sm mt-1">{item.justificativa}</p>
                          </div>
                        )}
                        
                        {item.observacoes && (
                          <div className="mt-3 p-3 bg-green-50 rounded">
                            <span className="font-medium text-green-800">Observações:</span>
                            <p className="text-green-700 text-sm mt-1">{item.observacoes}</p>
                          </div>
                        )}
                        
                        {item.observacoesGestao && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded">
                            <span className="font-medium text-yellow-800">Resposta da Gestão:</span>
                            <p className="text-yellow-700 text-sm mt-1">{item.observacoesGestao}</p>
                            {item.dataResposta && (
                              <p className="text-xs text-yellow-600 mt-1">
                                Respondido em: {formatDate(item.dataResposta)}
                              </p>
                            )}
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