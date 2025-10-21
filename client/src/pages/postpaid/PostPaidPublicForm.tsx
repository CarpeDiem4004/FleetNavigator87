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
import { Fuel, CheckCircle2, Share2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface Base {
  id: number;
  name: string;
  basename?: string;
}

export default function PostPaidPublicForm() {
  const { toast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedBase, setSelectedBase] = useState('');
  const [formData, setFormData] = useState({
    driver_name: '',
    driver_phone: '',
    vehicle_plate: '',
    odometer_km: '',
    fuel_type: '',
    liters: '',
    total_amount: '',
    manager_name: '',
  });
  
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const [totalAmount, setTotalAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Função para copiar link
  const copyFormLink = () => {
    const formUrl = window.location.href;
    navigator.clipboard.writeText(formUrl).then(() => {
      toast({
        title: 'Link copiado!',
        description: 'O link do formulário foi copiado para a área de transferência.',
      });
    }).catch(() => {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link. Por favor, copie manualmente da barra de endereço.',
        variant: 'destructive',
      });
    });
  };

  // Buscar projetos
  const { data: projectsResponse } = useQuery<{ success: boolean; data: Project[] }>({
    queryKey: ['/api/projects'],
  });
  const projects = Array.isArray(projectsResponse?.data) ? projectsResponse.data : [];

  // Buscar bases filtradas por projeto
  const { data: basesResponse } = useQuery<{ success: boolean; data: Base[] }>({
    queryKey: ['/api/bases', selectedProject],
    queryFn: async () => {
      const url = selectedProject 
        ? `/api/bases?project_id=${selectedProject}`
        : '/api/bases';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar bases');
      return response.json();
    },
    enabled: !!selectedProject,
  });
  const bases = Array.isArray(basesResponse?.data) ? basesResponse.data : [];

  // Handler para upload de foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A foto deve ter no máximo 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, envie uma imagem',
          variant: 'destructive',
        });
        return;
      }
      
      setReceiptPhoto(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mutation para enviar registro
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !selectedBase) {
        throw new Error('Selecione projeto e base');
      }

      // Criar FormData para enviar arquivo
      const formDataToSend = new FormData();
      formDataToSend.append('project_id', selectedProject);
      formDataToSend.append('base_id', selectedBase);
      formDataToSend.append('driver_name', formData.driver_name);
      formDataToSend.append('driver_phone', formData.driver_phone);
      formDataToSend.append('vehicle_plate', formData.vehicle_plate);
      formDataToSend.append('odometer_km', formData.odometer_km);
      formDataToSend.append('fuel_type', formData.fuel_type);
      formDataToSend.append('liters', formData.liters);
      formDataToSend.append('total_amount', formData.total_amount);
      formDataToSend.append('manager_name', formData.manager_name);
      
      if (receiptPhoto) {
        formDataToSend.append('receipt_photo', receiptPhoto);
      }

      // Fazer requisição com fetch direto (não usar apiRequest para FormData)
      const response = await fetch('/api/postpaid/public-records', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar registro');
      }

      return await response.json();
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

    if (!formData.driver_name || !formData.driver_phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e telefone do motorista.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.vehicle_plate || !formData.odometer_km) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha placa e quilometragem do veículo.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.fuel_type || !formData.liters || !formData.total_amount) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os dados do abastecimento.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.manager_name) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome do gestor/coordenador/líder.',
        variant: 'destructive',
      });
      return;
    }

    if (!receiptPhoto) {
      toast({
        title: 'Foto obrigatória',
        description: 'Por favor, anexe a foto da nota fiscal.',
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
                  driver_phone: '',
                  vehicle_plate: '',
                  odometer_km: '',
                  fuel_type: '',
                  liters: '',
                  total_amount: '',
                  manager_name: '',
                });
                setSelectedProject('');
                setSelectedBase('');
                setReceiptPhoto(null);
                setPhotoPreview('');
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fuel className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Registro de Abastecimento Pós-Pago</CardTitle>
                  <CardDescription>
                    Preencha todos os campos abaixo para registrar o abastecimento
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyFormLink}
                className="flex items-center gap-2"
                data-testid="button-copy-link"
              >
                <Share2 className="h-4 w-4" />
                Copiar Link
              </Button>
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
                          {base.name || base.basename || 'Base sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dados do Motorista */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Motorista</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Nome *</Label>
                    <Input
                      id="driver_name"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                      placeholder="Nome completo do motorista"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver_phone">Telefone *</Label>
                    <Input
                      id="driver_phone"
                      type="tel"
                      value={formData.driver_phone}
                      onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Veículo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Veículo</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_plate">Placa *</Label>
                    <Input
                      id="vehicle_plate"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC-1234"
                      maxLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometer_km">Quilometragem (KM) *</Label>
                    <Input
                      id="odometer_km"
                      type="number"
                      value={formData.odometer_km}
                      onChange={(e) => setFormData({ ...formData, odometer_km: e.target.value })}
                      placeholder="Ex: 150000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Abastecimento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Dados do Abastecimento</h3>
                <div className="grid md:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="liters">Litros Abastecidos *</Label>
                    <Input
                      id="liters"
                      type="number"
                      step="0.01"
                      value={formData.liters}
                      onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                      placeholder="Ex: 100.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Valor Total (R$) *</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      placeholder="Ex: 685.00"
                    />
                  </div>
                </div>
              </div>

              {/* Informações do Gestor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Informações do Gestor</h3>
                <div className="space-y-2">
                  <Label htmlFor="manager_name">Nome do Gestor/Coordenador/Líder *</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                    placeholder="Nome completo do responsável"
                  />
                </div>
              </div>

              {/* Upload de Foto da Nota */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Foto da Nota Fiscal</h3>
                <div className="space-y-2">
                  <Label htmlFor="receipt_photo">Anexar Foto da Nota *</Label>
                  <Input
                    id="receipt_photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500">
                    Tire uma foto clara da nota fiscal (máx 5MB)
                  </p>
                  {photoPreview && (
                    <div className="mt-4 relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview da nota" 
                        className="max-w-full h-auto rounded-lg border shadow-sm"
                        style={{ maxHeight: '400px' }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setReceiptPhoto(null);
                          setPhotoPreview('');
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
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
