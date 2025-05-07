import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Menu, Bell, Fuel, Droplets, ExternalLink } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { navigateTo } from '@/lib/navigation';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Get page title from current location
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/vehicles':
        return 'Veículos';
      case '/maintenance':
        return 'Manutenções';
      case '/tires':
        return 'Pneus';
      case '/refueling':
        return 'Abastecimentos';
      case '/fines':
        return 'Multas';
      case '/line-hall':
        return 'Line Hall';
      case '/bases':
        return 'Bases';
      case '/users':
        return 'Usuários';
      default:
        return 'FleetManager';
    }
  };
  
  // Fetch bases for the select
  const { data: bases } = useQuery({
    queryKey: ['/api/bases'],
    enabled: !!user,
  });

  return (
    <header className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="text-xl" />
          </button>
          <h1 className="ml-3 md:ml-0 text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Botões de Acesso Rápido para Postos Externos */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2 bg-primary-100 p-2 px-3 rounded-xl shadow-md">
              <span className="text-xs font-bold text-primary-800">POSTOS EXTERNOS:</span>
              <button 
                onClick={() => navigateTo('/posto-remedios')}
                className="ml-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium py-1 px-2 rounded flex items-center"
              >
                <Fuel size={14} className="mr-1" />
                Posto Remédios
              </button>
              <button 
                onClick={() => navigateTo('/posto-murici')}
                className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium py-1 px-2 rounded flex items-center"
              >
                <Fuel size={14} className="mr-1" />
                Posto Murici
              </button>
              <button 
                onClick={() => navigateTo('/posto-murici/links')}
                className="bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium py-1 px-2 rounded flex items-center"
              >
                <ExternalLink size={14} className="mr-1" />
                Links
              </button>
            </div>
          )}
          
          <div className="relative">
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <Bell className="text-xl" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
          <div className="relative">
            <span className="text-sm font-medium">Base: </span>
            {user?.baseId ? (
              <span className="text-sm ml-1">{user.basename || 'Global'}</span>
            ) : (
              <span className="text-sm ml-1">Global</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
