import React from 'react';
import { BarChart3 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import PainelPrincipal from '@/components/dashboard/PainelPrincipal';

/**
 * Dashboard com o novo painel principal
 */
const Dashboard: React.FC = () => {
  return (
    <MainLayoutSimple>
      <div className="bg-gray-50 w-full p-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-gray-700" />
        <h1 className="text-xl font-medium text-gray-800">Dashboard</h1>
      </div>
      
      <div className="p-4">
        <PainelPrincipal />
      </div>
    </MainLayoutSimple>
  );
};

export default Dashboard;
