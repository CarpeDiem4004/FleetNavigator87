import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Truck, FileText, Wrench } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DriverData {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  placa_veiculo?: string;
}

const DriverAccess: React.FC = () => {
  const [, setLocation] = useLocation();
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [driver, setDriver] = useState<DriverData | null>(null);
  const { toast } = useToast();

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
                  <CardTitle>Olá, {driver.nome}!</CardTitle>
                  <CardDescription>
                    CPF: {formatCPF(driver.cpf)} 
                    {driver.placa_veiculo && ` • Veículo: ${driver.placa_veiculo}`}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

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