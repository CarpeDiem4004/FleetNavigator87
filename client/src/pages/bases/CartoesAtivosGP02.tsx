import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import FuelCardManagement from '@/components/FuelCardManagement';

const CartoesAtivosGP02: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/bases/gp02/login');
  };

  // Verificar se o usuário tem permissão de administrador
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/bases/gp02">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cartões Ativos - GP02</h1>
                  <p className="text-gray-600">Gerenciamento de cartões de combustível</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="text-red-600 hover:text-red-800"
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-red-700">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta funcionalidade
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Esta funcionalidade é restrita apenas para administradores do sistema.
              </p>
              <Link href="/bases/gp02">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Base GP02
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/bases/gp02">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cartões Ativos - GP02</h1>
                <p className="text-gray-600">Gerenciamento de cartões de combustível</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="text-red-600 hover:text-red-800"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <CreditCard className="w-5 h-5 mr-2" />
              Gerenciamento de Cartões Ativos - Base GP02
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie os cartões de combustível que estão ativos e em uso na base GP02 - Jacarei.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Funcionalidades Disponíveis</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Cadastrar novos cartões de combustível</li>
                <li>• Editar informações dos cartões existentes</li>
                <li>• Ativar/desativar cartões conforme necessário</li>
                <li>• Visualizar histórico de movimentações</li>
                <li>• Exportar relatórios de uso</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Componente de Gerenciamento de Cartões */}
        <FuelCardManagement />
      </div>
    </div>
  );
};

export default CartoesAtivosGP02;