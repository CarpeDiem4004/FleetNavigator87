import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

interface MainLayoutSimpleProps {
  children: ReactNode;
}

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page after successful logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header com botão de logout */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Muricion Fleet - Line Hall
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.name || 'Usuário'}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gray-50">
        <div className="container mx-auto py-6 px-4 sm:px-6">
          {children}
        </div>
      </div>
      <footer className="bg-gradient-to-r from-primary-900/5 to-primary-800/5 border-t border-primary-100/20 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Muricion Fleet - Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};

export default MainLayoutSimple;