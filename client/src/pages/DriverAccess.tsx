import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Truck, FileText, Wrench, MapPin, Clock, Calendar, LogOut, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
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
  const [showFuelRequest, setShowFuelRequest] = useState(false);
  const [fuelRequests, setFuelRequests] = useState<any[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Cleanup polling interval quando componente é desmontado
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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

  // Função para buscar todas as solicitações de recarga do motorista
  const fetchFuelRequests = async (motoristaId: number) => {
    try {
      const response = await apiRequest('GET', `/api/line-hall/fuel-requests?motorista_id=${motoristaId}`);
      const data = await response.json();
      
      if (data.success) {
        setFuelRequests(data.data || []);
        
        // Mostrar notificações apenas para solicitações processadas recentemente
        const recentRequests = data.data.filter((request: any) => 
          request.status !== 'pendente' && 
          new Date(request.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        );
        
        recentRequests.forEach((request: any) => {
          if (request.status === 'aprovada') {
            toast({
              title: "Solicitação Aprovada",
              description: `Sua solicitação de recarga de cartão foi aprovada! Placa: ${request.veiculo_placa}`,
              duration: 8000,
            });
          } else if (request.status === 'rejeitada') {
            toast({
              title: "Solicitação Rejeitada",
              description: `Sua solicitação de recarga foi rejeitada. ${request.observacoes_operador ? 'Motivo: ' + request.observacoes_operador : ''}`,
              variant: "destructive",
              duration: 8000,
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações de recarga:', error);
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
        // Buscar solicitações de recarga
        await fetchFuelRequests(data.motorista.id);
        
        // Iniciar polling para atualizações em tempo real
        const interval = setInterval(() => {
          fetchFuelRequests(data.motorista.id);
        }, 10000); // Atualizar a cada 10 segundos
        
        setPollingInterval(interval);
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

  const handleFuelRequestClick = () => {
    setShowFuelRequest(true);
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleFuelRequestClick}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Solicitar Recarga</CardTitle>
              <CardDescription>
                Solicite recarga de cartão combustível para sua viagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="default">
                <CreditCard className="mr-2 h-4 w-4" />
                Solicitar Recarga
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Solicitações de Recarga de Cartão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Minhas Solicitações de Recarga de Cartão
              {fuelRequests.length > 0 && (
                <RefreshCw className="h-4 w-4 ml-2 text-gray-400 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fuelRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma solicitação de recarga encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fuelRequests.map((request: any) => (
                  <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">Solicitação #{request.id}</p>
                        <p className="text-sm text-gray-600">Veículo: {request.veiculo_placa}</p>
                        <p className="text-sm text-gray-600">Rota: {request.origem} → {request.destino}</p>
                      </div>
                      <Badge 
                        variant={
                          request.status === 'aprovada' ? 'default' :
                          request.status === 'rejeitada' ? 'destructive' :
                          'secondary'
                        }
                        className={
                          request.status === 'aprovada' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejeitada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {request.status === 'aprovada' ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Aprovada</>
                        ) : request.status === 'rejeitada' ? (
                          <><XCircle className="w-3 h-3 mr-1" /> Rejeitada</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Pendente</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Data/Hora:</span> {new Date(request.created_at).toLocaleString('pt-BR')}
                      </div>
                      <div>
                        <span className="font-medium">KM Total:</span> {request.km_total} km
                      </div>
                      <div>
                        <span className="font-medium">Horário Preferido:</span> {request.horario_abastecimento === 'antes_17h' ? 'Antes das 17h' : 'Após 18h'}
                      </div>
                      <div>
                        <span className="font-medium">Telefone:</span> {request.telefone_motorista}
                      </div>
                      {((request as any).valor_calculado || request.valor_solicitado) && (
                        <div>
                          <span className="font-medium">Valor Solicitado:</span> R$ {parseFloat((request as any).valor_calculado || request.valor_solicitado || 0).toFixed(2)}
                        </div>
                      )}
                      {request.valor_aprovado ? (
                        <div className="text-green-700 font-semibold">
                          <span className="font-medium">Valor Aprovado:</span> R$ {parseFloat(request.valor_aprovado).toFixed(2)}
                        </div>
                      ) : request.status === 'aprovada' && (request as any).valor_calculado && (
                        <div className="text-green-700 font-semibold">
                          <span className="font-medium">Valor Aprovado:</span> R$ {parseFloat((request as any).valor_calculado).toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {request.status === 'aprovada' && (
                      <div className="mt-2 p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="text-sm text-green-700 font-medium">
                          ✅ Solicitação aprovada! Você pode abastecer conforme solicitado.
                        </p>
                        {(request.valor_aprovado || (request as any).valor_calculado) && (
                          <p className="text-sm text-green-700 mt-2 font-bold bg-green-100 p-2 rounded">
                            💰 <strong>Valor Liberado para Recarga:</strong> R$ {parseFloat(request.valor_aprovado || (request as any).valor_calculado || 0).toFixed(2)}
                          </p>
                        )}
                        {request.operador_aprovacao && (
                          <p className="text-sm text-green-600 mt-1">
                            <strong>Aprovado por:</strong> {request.operador_aprovacao}
                          </p>
                        )}
                        {request.observacoes_operador && (
                          <p className="text-sm text-green-600 mt-1">
                            <strong>Observações:</strong> {request.observacoes_operador}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {request.status === 'rejeitada' && (
                      <div className="mt-2 p-3 bg-red-50 rounded border-l-4 border-red-400">
                        <p className="text-sm text-red-700 font-medium">
                          ❌ Solicitação rejeitada.
                        </p>
                        {request.observacoes_operador && (
                          <p className="text-sm text-red-600 mt-1">
                            <strong>Motivo:</strong> {request.observacoes_operador}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {request.status === 'pendente' && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="text-sm text-yellow-700 font-medium">
                          ⏳ Aguardando análise do operador...
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          Você será notificado quando a solicitação for aprovada ou rejeitada.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Solicitado em: {new Date(request.created_at).toLocaleString('pt-BR')}
                      {request.updated_at && request.status !== 'pendente' && (
                        <> • Processado em: {new Date(request.updated_at).toLocaleString('pt-BR')}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Modal de Solicitação de Recarga de Cartão */}
        {showFuelRequest && (
          <FuelRequestModal 
            driver={driver}
            onClose={() => setShowFuelRequest(false)}
          />
        )}
      </div>
    </div>
  );
};

// Componente do Modal de Solicitação de Recarga
const FuelRequestModal = ({ driver, onClose }: { driver: any; onClose: () => void }) => {
  const [phone, setPhone] = useState('');
  const [fuelTime, setFuelTime] = useState<'antes_17h' | 'apos_18h'>('antes_17h');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu número de telefone",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const requestData = {
        motorista_id: driver.id,
        motorista_nome: driver.nome,
        motorista_cpf: driver.cpf,
        veiculo_placa: driver.placa_veiculo,
        veiculo_modelo: driver.tipo_veiculo,
        rota_origem: driver.viagem?.local_carregamento,
        rota_destino: driver.viagem?.local_descarregamento,
        data_solicitacao: now.toISOString().split('T')[0],
        horario_solicitacao: now.toTimeString().split(' ')[0],
        km_total: calculateTotalKm(driver.viagem?.local_carregamento, driver.viagem?.local_destino),
        horario_abastecimento: fuelTime,
        telefone_motorista: phone,
        status: 'pendente'
      };

      const response = await apiRequest('POST', '/api/line-hall/fuel-request', requestData);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Solicitação enviada",
          description: "Sua solicitação de recarga foi enviada com sucesso!"
        });
        onClose();
      } else {
        throw new Error(data.message || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalKm = (origem: string, destino: string) => {
    // Aqui você pode implementar uma lógica para calcular KM
    // Por enquanto, retornaremos um valor estimado baseado nas rotas comuns
    const routes: { [key: string]: number } = {
      'São Paulo - Campinas': 100,
      'São Paulo - Santos': 80,
      'Campinas - São Paulo': 100,
      'Santos - São Paulo': 80
    };
    
    const routeKey = `${origem} - ${destino}`;
    return routes[routeKey] || 150; // valor padrão
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Solicitar Recarga de Cartão</h2>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>

            {/* Dados do Veículo (preenchidos automaticamente) */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Placa</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {driver?.placa_veiculo || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Modelo</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {driver?.tipo_veiculo || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Rota */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Rota</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {driver?.viagem?.local_carregamento || 'Origem'} → {driver?.viagem?.local_descarregamento || 'Destino'}
                </div>
              </div>

              {/* Data e Horário (preenchidos automaticamente) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Horário</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {new Date().toTimeString().split(' ')[0]}
                  </div>
                </div>
              </div>

              {/* KM Total (calculado automaticamente) */}
              <div>
                <Label className="text-sm font-medium text-gray-700">KM Total Estimado</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {calculateTotalKm(driver?.viagem?.local_carregamento, driver?.viagem?.local_destino)} km
                </div>
              </div>

              {/* Campos editáveis */}
              <div>
                <Label htmlFor="fuelTime" className="text-sm font-medium text-gray-700">
                  Horário de Abastecimento *
                </Label>
                <select
                  id="fuelTime"
                  value={fuelTime}
                  onChange={(e) => setFuelTime(e.target.value as 'antes_17h' | 'apos_18h')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="antes_17h">Antes das 17h</option>
                  <option value="apos_18h">Após as 18h</option>
                </select>
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Número de Telefone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Solicitar
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverAccess;