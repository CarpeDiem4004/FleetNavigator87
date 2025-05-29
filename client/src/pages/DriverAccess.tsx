import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Truck, FileText, Wrench, MapPin, Clock, Calendar, LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DriverData {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  placa_veiculo?: string;
  tipo_veiculo?: string;
  placa_carreta?: string;
  viagem?: {
    local_carregamento: string;
    local_descarregamento: string;
    data_viagem: string;
    horario_carregamento: string;
    status: string;
  };
}

const DriverAccess: React.FC = () => {
  const [, setLocation] = useLocation();
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [tripStatus, setTripStatus] = useState<'programada' | 'em_andamento' | 'concluida'>('programada');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const { toast } = useToast();

  // Função para buscar solicitações de manutenção do motorista
  const fetchMaintenanceRequests = async (motoristaId: number) => {
    try {
      const response = await apiRequest('GET', `/api/line-hall/motorista/${motoristaId}/maintenance-requests`);
      const data = await response.json();
      
      if (data.success) {
        setMaintenanceRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações de manutenção:', error);
    }
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara de CPF
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return numbers.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setCpf(formattedCPF);
  };

  const handleLogin = async () => {
    if (!cpf || cpf.length < 14) {
      toast({
        title: "CPF inválido",
        description: "Por favor, digite um CPF válido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/line-hall/motorista/login', {
        cpf: cpf.replace(/\D/g, '') // Remove formatação para enviar apenas números
      });

      const data = await response.json();
      
      if (data.success) {
        setDriver(data.motorista);
        // Buscar solicitações de manutenção do motorista
        await fetchMaintenanceRequests(data.motorista.id);
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${data.motorista.nome}!`
        });
      } else {
        toast({
          title: "Motorista não encontrado",
          description: "CPF não cadastrado no sistema",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Erro ao tentar fazer login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChecklistClick = () => {
    if (driver) {
      setLocation(`/driver-checklist/${driver.id}`);
    }
  };

  const handleMaintenanceRequestClick = () => {
    if (driver) {
      setLocation(`/driver-maintenance-request/${driver.id}`);
    }
  };

  const handleLogout = () => {
    setDriver(null);
    setCpf('');
  };

  const handleTripStatusUpdate = async (newStatus: 'em_andamento' | 'concluida') => {
    if (!driver) return;

    setUpdatingStatus(true);
    try {
      const response = await apiRequest('POST', '/api/line-hall/trip/update-status', {
        motorista_id: driver.id,
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      const data = await response.json();
      
      if (data.success) {
        setTripStatus(newStatus);
        toast({
          title: "Status atualizado",
          description: newStatus === 'em_andamento' 
            ? "Viagem iniciada com sucesso!" 
            : "Viagem concluída com sucesso!"
        });
      } else {
        throw new Error(data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da viagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da viagem",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'em andamento':
        return 'bg-blue-100 text-blue-800';
      case 'programado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Acesso do Motorista</CardTitle>
            <CardDescription>
              Line Hall Shopee - Digite seu CPF para acessar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                className="text-center text-lg"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do motorista */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{driver.nome}</CardTitle>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.viagem?.status || 'Aguardando')}`}>
                    {driver.viagem?.status || 'Aguardando'}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Informações dos Veículos */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">{driver.tipo_veiculo}</div>
              <div className="text-lg font-bold text-blue-800">{driver.placa_veiculo}</div>
            </CardContent>
          </Card>
          
          {driver.placa_carreta && (
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Carreta 1</div>
                <div className="text-lg font-bold text-blue-800">{driver.placa_carreta}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informações da Viagem */}
        {driver.viagem && (
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Local de Carregamento */}
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                <div>
                  <div className="text-sm text-gray-600">Local de Carregamento</div>
                  <div className="font-semibold">{driver.viagem.local_carregamento}</div>
                </div>
              </div>

              {/* Local de Descarregamento */}
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
                <div>
                  <div className="text-sm text-gray-600">Local de Descarregamento</div>
                  <div className="font-semibold">{driver.viagem.local_descarregamento}</div>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Data da Viagem</div>
                    <div className="font-semibold">
                      {driver.viagem.data_viagem === 'Invalid Date' 
                        ? 'Invalid Date' 
                        : driver.viagem.data_viagem}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Horário de Carregamento</div>
                    <div className="font-semibold">{driver.viagem.horario_carregamento}</div>
                  </div>
                </div>
              </div>

              {/* Controles de Status da Viagem */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">Status da Viagem:</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tripStatus === 'programada' ? 'bg-yellow-100 text-yellow-800' :
                    tripStatus === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {tripStatus === 'programada' ? 'Programada' :
                     tripStatus === 'em_andamento' ? 'Em Andamento' :
                     'Concluída'}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-3">
                  {tripStatus === 'programada' && (
                    <Button 
                      onClick={() => handleTripStatusUpdate('em_andamento')}
                      disabled={updatingStatus}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Iniciar Viagem
                    </Button>
                  )}
                  
                  {tripStatus === 'em_andamento' && (
                    <Button 
                      onClick={() => handleTripStatusUpdate('concluida')}
                      disabled={updatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-2" />
                      )}
                      Viagem Concluída
                    </Button>
                  )}
                  
                  {tripStatus === 'concluida' && (
                    <div className="col-span-2 text-center py-2 text-green-600 font-medium">
                      ✓ Viagem concluída com sucesso!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu de opções */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleChecklistClick}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Realizar Checklist</CardTitle>
              <CardDescription>
                Faça a verificação do seu veículo antes da viagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                <FileText className="mr-2 h-4 w-4" />
                Iniciar Checklist
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleMaintenanceRequestClick}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Solicitar Manutenção</CardTitle>
              <CardDescription>
                Reporte problemas ou solicite manutenção do veículo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                <Wrench className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Solicitações de Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-blue-600" />
              Minhas Solicitações de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma solicitação de manutenção encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {maintenanceRequests.map((request: any) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">Protocolo: {request.protocolo}</p>
                        <p className="text-sm text-gray-600">Veículo: {request.vehicle_plate}</p>
                      </div>
                      <Badge 
                        variant={
                          request.status === 'concluida' ? 'default' :
                          request.status === 'em_andamento' ? 'secondary' :
                          request.status === 'pendente' ? 'destructive' :
                          'outline'
                        }
                        className={
                          request.status === 'concluida' ? 'bg-green-100 text-green-800' :
                          request.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {request.status === 'concluida' ? 'Concluída' :
                         request.status === 'em_andamento' ? 'Em Andamento' :
                         request.status === 'pendente' ? 'Pendente' :
                         request.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{request.description}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Urgência: {request.urgency}</span>
                      <span>Criado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    {request.status === 'concluida' && request.completed_at && (
                      <div className="mt-2 p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="text-sm text-green-700">
                          ✅ Concluída em: {new Date(request.completed_at).toLocaleDateString('pt-BR')}
                        </p>
                        {request.notes && (
                          <p className="text-sm text-green-600 mt-1">Observações: {request.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Realize sempre o checklist antes de iniciar a viagem</p>
              <p>• Reporte imediatamente qualquer problema no veículo</p>
              <p>• Em caso de emergência, entre em contato com a central</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverAccess;