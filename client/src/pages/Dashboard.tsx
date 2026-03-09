import React from 'react';
import { BarChart3, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import PainelPrincipal from '@/components/dashboard/PainelPrincipal';
import RecebimentosSummary from '@/components/dashboard/RecebimentosSummary';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Dashboard com o novo painel principal
 */
const Dashboard: React.FC = () => {
  const currentDate = new Date();
  const formattedDate = format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  return (
    <MainLayoutSimple>
      <div className="bg-gray-50 w-full p-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="bg-primary-100 p-2 rounded-lg mr-3">
            <BarChart3 className="h-6 w-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" /> 
              {formattedDate}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50 space-y-6">
        <PainelPrincipal />
        <RecebimentosSummary />
      </div>
    </MainLayoutSimple>
  );
};

export default Dashboard;
