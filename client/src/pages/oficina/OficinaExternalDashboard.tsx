import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  Wrench, 
  AlertTriangle,
  User,
  Calendar,
  Settings
} from 'lucide-react';

interface WorkshopData {
  id: number;
  name: string;
  cnpj: string;
  email: string;
  telefone: string;
}

interface MaintenanceRequest {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  customerName?: string;
}

interface CarReception {
  id: number;
  vehiclePlate: string;
  customerName: string;
  receptionDate: string;
  status: string;
}

export default function OficinaExternalDashboard() {
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [carReceptions, setCarReceptions] = useState<CarReception[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      setError('Token de acesso não fornecido');
      setIsLoading(false);
      return;
    }

    validateTokenAndLoadData(token);
  }, []);

  const validateTokenAndLoadData = async (token: string) => {
    try {
      // Validar token e obter dados da oficina
      const response = await fetch(`/api/maintenance/workshops/validate-token?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkshopData(data.workshop);
        await loadWorkshopData(data.workshop.id, token);
      } else {
        setError(data.message || 'Token inválido');
      }
    } catch (err) {
      setError('Erro ao validar token');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkshopData = async (workshopId: number, token: string) => {
    try {
      // Carregar solicitações de manutenção
      const maintenanceResponse = await fetch(`/api/maintenance/workshop/${workshopId}/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRequests(maintenanceData.requests || []);
      }

      // Carregar recepções de carros
      const receptionResponse = await fetch(`/api/oficina/car-receptions?workshop=${workshopId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (receptionResponse.ok) {
        const receptionData = await receptionResponse.json();
        setCarReceptions(receptionData.receptions || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da oficina:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Validando acesso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-muted-foreground mt-2">
              Verifique se o link está correto ou entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = maintenanceRequests.filter(r => r.status === 'pendente');
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'em_andamento');
  const completedRequests = maintenanceRequests.filter(r => r.status === 'concluida');

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard - {workshopData?.name}</h1>
            <p className="text-muted-foreground">
              Sistema de Gestão de Manutenção - CNPJ: {workshopData?.cnpj}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Oficina Externa
            </Badge>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carros Recebidos</p>
                <p className="text-2xl font-bold">{carReceptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">OS Pendentes</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Wrench className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{inProgressRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button className="flex items-center gap-2 h-auto p-4 justify-start">
                <Car className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Receber Veículo</p>
                  <p className="text-sm opacity-80">Registrar entrada na oficina</p>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4 justify-start">
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Nova OS</p>
                  <p className="text-sm opacity-80">Criar ordem de serviço</p>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2 h-auto p-4 justify-start">
                <CheckCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Finalizar Serviço</p>
                  <p className="text-sm opacity-80">Concluir manutenção</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seções Principais */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recepção de Veículos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Recepção de Veículos
              </CardTitle>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Receber Veículo
              </Button>
            </div>
            <CardDescription>
              Veículos recebidos para manutenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {carReceptions.length === 0 ? (
                <div className="text-center py-6">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum veículo recebido hoje</p>
                  <Button size="sm" className="mt-2">
                    Receber Primeiro Veículo
                  </Button>
                </div>
              ) : (
                <>
                  {carReceptions.slice(0, 3).map((reception) => (
                    <div key={reception.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{reception.vehiclePlate}</p>
                        <p className="text-sm text-muted-foreground">{reception.customerName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {new Date(reception.receptionDate).toLocaleDateString()}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{reception.status}</p>
                      </div>
                    </div>
                  ))}
                  {carReceptions.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todos ({carReceptions.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ordens de Serviço */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ordens de Serviço
              </CardTitle>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova OS
              </Button>
            </div>
            <CardDescription>
              Serviços em andamento e pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma OS pendente</p>
                  <Button size="sm" className="mt-2">
                    Criar Nova OS
                  </Button>
                </div>
              ) : (
                <>
                  {maintenanceRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">OS #{request.id} - {request.vehiclePlate}</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            request.status === 'concluida' ? 'default' :
                            request.status === 'em_andamento' ? 'secondary' : 'outline'
                          }
                        >
                          {request.status === 'pendente' ? 'Pendente' :
                           request.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(request.entryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {maintenanceRequests.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      Ver todas ({maintenanceRequests.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações da Oficina */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações da Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                <p className="font-medium">{workshopData?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                <p className="font-medium">{workshopData?.cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{workshopData?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}