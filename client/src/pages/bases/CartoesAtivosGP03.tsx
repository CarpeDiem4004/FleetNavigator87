import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import FuelCardManagement from '@/components/FuelCardManagement';

const CartoesAtivosGP03: React.FC = () => {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/bases/gp03/login');
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
                <Link href="/bases/gp03">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cartões Ativos - GP03</h1>
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
              <Link href="/bases/gp03">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Base GP03
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
              <Link href="/bases/gp03">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cartões Ativos - GP03</h1>
                <p className="text-gray-600">Gerenciamento de cartões de combustível</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Settings className="w-4 h-4" />
                <span>Administrador</span>
              </div>
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
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-800">
                <CreditCard className="w-5 h-5 mr-2" />
                Gerenciamento de Cartões de Combustível
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Cadastre, edite e gerencie os cartões de combustível que estão ativos e em uso na base GP03 - Hortolandia
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <FuelCardManagement />
      </div>
    </div>
  );
};

export default CartoesAtivosGP03;