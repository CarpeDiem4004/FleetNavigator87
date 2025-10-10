import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Fuel, CheckCircle2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface Base {
  id: number;
  basename: string;
}

export default function PostPaidPublicForm() {
  const { toast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [formData, setFormData] = useState({
    driver_name: '',
    driver_rg: '',
    driver_phone: '',
    vehicle_plate: '',
    fuel_type: '',
    price_per_liter: '',
    liters: '',
    period: '',
    manager_name: '',
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Buscar projetos
  const { data: projectsResponse } = useQuery<{ success: boolean; data: Project[] }>({
    queryKey: ['/api/projects'],
  });
  const projects = Array.isArray(projectsResponse?.data) ? projectsResponse.data : [];

  // Buscar bases filtradas por projeto
  const { data: basesResponse } = useQuery<{ success: boolean; data: Base[] }>({
    queryKey: ['/api/bases', selectedProject],
    enabled: !!selectedProject,
  });
  const bases = Array.isArray(basesResponse?.data) ? basesResponse.data : [];

  // Calcular valor total automaticamente
  useEffect(() => {
    const price = parseFloat(formData.price_per_liter) || 0;
    const liters = parseFloat(formData.liters) || 0;
    setTotalAmount(price * liters);
  }, [formData.price_per_liter, formData.liters]);

  // Mutation para enviar registro
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !selectedBase) {
        throw new Error('Selecione projeto e base');
      }

      const response = await apiRequest('POST', '/api/postpaid/public-records', {
        project_id: parseInt(selectedProject),
        base_id: parseInt(selectedBase),
        ...formData,
        price_per_liter: parseFloat(formData.price_per_liter),
        liters: parseFloat(formData.liters),
        total_amount: totalAmount,
      });
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: 'Registro enviado com sucesso!',
        description: 'O abastecimento foi registrado.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar registro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!selectedProject || !selectedBase) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o projeto e a base.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.driver_name || !formData.driver_rg || !formData.driver_phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os dados do motorista.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.vehicle_plate || !formData.fuel_type || !formData.price_per_liter || !formData.liters) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os dados do abastecimento.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.period || !formData.manager_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o período e nome do gestor.',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Registro Enviado!</CardTitle>
            <CardDescription>
              O abastecimento foi registrado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  driver_name: '',
                  driver_rg: '',
                  driver_phone: '',
                  vehicle_plate: '',
                  fuel_type: '',
                  price_per_liter: '',
                  liters: '',
                  period: '',
                  manager_name: '',
                });
                setSelectedProject('');
                setSelectedBase('');
                setTotalAmount(0);
              }}
              className="w-full"
            >
              Registrar Novo Abastecimento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Fuel className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Registro de Abastecimento Pós-Pago</CardTitle>
                <CardDescription>
                  Preencha todos os campos abaixo para registrar o abastecimento
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de Projeto e Base */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Projeto *</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={(value) => {
                      setSelectedProject(value);
                      setSelectedBase('');
                    }}
                  >
                    <SelectTrigger id="project">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base">Base *</Label>
                  <Select
                    value={selectedBase}
                    onValueChange={setSelectedBase}
                    disabled={!selectedProject}
                  >
                    <SelectTrigger id="base">
                      <SelectValue placeholder="Selecione a base" />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.basename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dados do Motorista */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Motorista</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Nome do Motorista *</Label>
                    <Input
                      id="driver_name"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver_rg">RG do Motorista *</Label>
                    <Input
                      id="driver_rg"
                      value={formData.driver_rg}
                      onChange={(e) => setFormData({ ...formData, driver_rg: e.target.value })}
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver_phone">Telefone do Motorista *</Label>
                    <Input
                      id="driver_phone"
                      value={formData.driver_phone}
                      onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Veículo e Abastecimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Abastecimento</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                    <Input
                      id="vehicle_plate"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Tipo de Combustível *</Label>
                    <Select
                      value={formData.fuel_type}
                      onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                    >
                      <SelectTrigger id="fuel_type">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diesel S10">Diesel S10</SelectItem>
                        <SelectItem value="Diesel Comum">Diesel Comum</SelectItem>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        <SelectItem value="Etanol">Etanol</SelectItem>
                        <SelectItem value="Arla 32">Arla 32</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_liter">Preço por Litro (R$) *</Label>
                    <Input
                      id="price_per_liter"
                      type="number"
                      step="0.01"
                      value={formData.price_per_liter}
                      onChange={(e) => setFormData({ ...formData, price_per_liter: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liters">Quantidade (Litros) *</Label>
                    <Input
                      id="liters"
                      type="number"
                      step="0.01"
                      value={formData.liters}
                      onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Total</Label>
                    <div className="text-2xl font-bold text-green-600 mt-2">
                      R$ {totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informações Adicionais</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">Período *</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => setFormData({ ...formData, period: value })}
                    >
                      <SelectTrigger id="period">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">Manhã (AM)</SelectItem>
                        <SelectItem value="PM">Tarde (PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager_name">Nome do Gestor *</Label>
                    <Input
                      id="manager_name"
                      value={formData.manager_name}
                      onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                      placeholder="Nome do gestor responsável"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Enviando...' : 'Registrar Abastecimento'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
