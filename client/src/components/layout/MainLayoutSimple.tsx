import React from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  Truck, 
  Wrench, 
  Disc, 
  Droplets, 
  AlertTriangle, 
  Map, 
  Building2, 
  Users, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutSimpleProps {
  children: React.ReactNode;
}

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [_, navigate] = useLocation();
  const [location] = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/' },
    { name: 'Veículos', icon: <Truck size={20} />, path: '/vehicles' },
    { name: 'Manutenção', icon: <Wrench size={20} />, path: '/maintenance' },
    { name: 'Pneus', icon: <Disc size={20} />, path: '/tires' },
    { name: 'Abastecimento', icon: <Droplets size={20} />, path: '/refueling' },
    { name: 'Multas', icon: <AlertTriangle size={20} />, path: '/fines' },
    { name: 'Line Haul', icon: <Map size={20} />, path: '/line-hall' },
    { name: 'Bases', icon: <Building2 size={20} />, path: '/bases' },
    { name: 'Usuários', icon: <Users size={20} />, path: '/users' },
  ];

  // Função para verificar se um item de menu está ativo
  const isActive = (path: string) => {
    return location === path;
  };

  const logout = () => {
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className={`bg-gray-900 text-gray-100 w-64 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:w-64`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Gestão de Frotas</h2>
            <button 
              className="p-1 rounded-md hover:bg-gray-800 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800 hover:text-white"
            >
              <LogOut size={20} className="mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              className="p-1 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-3 text-xl font-semibold text-gray-900 lg:ml-0">
              Sistema de Gestão de Frotas
            </h1>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Administrador</p>
                  <p className="text-xs text-gray-500">master@muricionfleet.com</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  M
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayoutSimple;