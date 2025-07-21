import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Fuel, 
  Car, 
  User, 
  Phone, 
  Building,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface Base {
  id: number;
  name: string;
  description?: string;
}

const CartaoCombustivelGoianiaExterno: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    plate: '',
    odometer: '',
    cardNumber: '',
    cardType: '',
    amount: '',
    provider: '',
    fuelType: '',
    driverName: '',
    driverPhone: '',
    projectId: '',
    baseId: '3', // Goiânia base ID
    reason: ''
  });

  const cardTypes = [
    { value: 'vinculado', label: 'Vinculado à Placa' },
    { value: 'especifico', label: 'Específico do Veículo' },
    { value: 'corporativo', label: 'Corporativo' }
  ];

  const providers = [
    { value: 'Shell', label: 'Shell' },
    { value: 'Ticket', label: 'Ticket Car' },
    { value: 'Alelo', label: 'Alelo Frotas' },
    { value: 'Visa', label: 'Visa Fleet' }
  ];

  const fuelTypes = [
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Etanol', label: 'Etanol' },
    { value: 'GNV', label: 'GNV' }
  ];

  useEffect(() => {
    fetchProjectsAndBases();
  }, []);

  const fetchProjectsAndBases = async () => {
    try {
      const [projectsResponse, basesResponse] = await Promise.all([
        fetch('/api/public/projects'),
        fetch('/api/public/bases')
      ]);

      if (projectsResponse.ok && basesResponse.ok) {
        const projectsData = await projectsResponse.json();
        const basesData = await basesResponse.json();
        setProjects(projectsData.data || []);
        setBases(basesData.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos e bases:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e formata
    const number = parseFloat(numericValue) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  const handleAmountChange = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Limita a 6 dígitos (máximo R$ 9.999,99)
    const limitedValue = numericValue.slice(0, 6);
    
    // Converte para número e formata
    const number = parseFloat(limitedValue) / 100;
    
    setFormData(prev => ({
      ...prev,
      amount: number.toFixed(2)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validações básicas
      if (!formData.plate || !formData.cardNumber || !formData.amount || !formData.reason) {
        toast({
          title: "Erro na validação",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(formData.amount);
      if (amount < 10 || amount > 5000) {
        toast({
          title: "Valor inválido",
          description: "O valor deve estar entre R$ 10,00 e R$ 5.000,00",
          variant: "destructive",
        });
        return;
      }

      // Enviar solicitação
      const response = await fetch('/api/public/fuel-card/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: amount,
          projectId: formData.projectId ? parseInt(formData.projectId) : null,
          baseId: parseInt(formData.baseId),
          baseName: 'Goiânia'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        toast({
          title: "Solicitação enviada com sucesso!",
          description: "Sua solicitação de recarga será analisada pela equipe responsável.",
        });
        
        // Reset form
        setFormData({
          plate: '',
          odometer: '',
          cardNumber: '',
          cardType: '',
          amount: '',
          provider: '',
          fuelType: '',
          driverName: '',
          driverPhone: '',
          projectId: '',
          baseId: '3',
          reason: ''
        });
      } else {
        toast({
          title: "Erro ao enviar solicitação",
          description: result.message || "Tente novamente mais tarde",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Solicitação Enviada!
            </CardTitle>
            <CardDescription className="text-green-600">
              Sua solicitação de recarga de cartão combustível foi enviada com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              A equipe da Base Goiânia analisará sua solicitação e entrará em contato em breve.
            </p>
            <Button 
              onClick={() => setSubmitSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Fazer Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Base Goiânia - Cartão Combustível
              </h1>
              <p className="text-gray-600 mt-2">
                Solicitação de Recarga de Cartão Combustível
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="w-5 h-5 mr-2" />
              Formulário de Solicitação
            </CardTitle>
            <CardDescription>
              Preencha todos os campos para solicitar uma recarga de cartão combustível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Veículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plate" className="flex items-center mb-2">
                    <Car className="w-4 h-4 mr-2" />
                    Placa do Veículo *
                  </Label>
                  <Input
                    id="plate"
                    placeholder="Ex: ABC1234"
                    value={formData.plate}
                    onChange={(e) => handleInputChange('plate', e.target.value.toUpperCase())}
                    className="uppercase"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="odometer" className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Hodômetro (KM)
                  </Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="Ex: 45000"
                    value={formData.odometer}
                    onChange={(e) => handleInputChange('odometer', e.target.value)}
                  />
                </div>
              </div>

              {/* Dados do Cartão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cardNumber" className="flex items-center mb-2">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Placa do Cartão *
                  </Label>
                  <Input
                    id="cardNumber"
                    placeholder="Ex: ****1234"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="cardType" className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2" />
                    Tipo do Cartão
                  </Label>
                  <Select value={formData.cardType} onValueChange={(value) => handleInputChange('cardType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cardTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount" className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Valor Solicitado *
                  </Label>
                  <Input
                    id="amount"
                    placeholder="Ex: 200.00"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Combustível */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider" className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2" />
                    Fornecedor
                  </Label>
                  <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="fuelType" className="flex items-center mb-2">
                    <Fuel className="w-4 h-4 mr-2" />
                    Tipo de Combustível
                  </Label>
                  <Select value={formData.fuelType} onValueChange={(value) => handleInputChange('fuelType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map(fuel => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {fuel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dados do Motorista */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driverName" className="flex items-center mb-2">
                    <User className="w-4 h-4 mr-2" />
                    Nome do Motorista
                  </Label>
                  <Input
                    id="driverName"
                    placeholder="Ex: João Silva"
                    value={formData.driverName}
                    onChange={(e) => handleInputChange('driverName', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="driverPhone" className="flex items-center mb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    Telefone do Motorista
                  </Label>
                  <Input
                    id="driverPhone"
                    placeholder="Ex: (62) 99999-9999"
                    value={formData.driverPhone}
                    onChange={(e) => handleInputChange('driverPhone', e.target.value)}
                  />
                </div>
              </div>

              {/* Projeto e Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectId" className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2" />
                    Projeto
                  </Label>
                  <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="baseId" className="flex items-center mb-2">
                    <Building className="w-4 h-4 mr-2" />
                    Base
                  </Label>
                  <Input
                    id="baseId"
                    value="Goiânia"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <Label htmlFor="reason" className="flex items-center mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  Justificativa da Solicitação *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Descreva o motivo da solicitação de recarga..."
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* Botão de Envio */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartaoCombustivelGoianiaExterno;