import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type MaintenanceStatusType = 'concluida' | 'em_andamento' | 'aguardando_pecas';

const getStatusBadge = (status: MaintenanceStatusType) => {
  switch (status) {
    case 'concluida':
      return <Badge variant="success">Concluída</Badge>;
    case 'em_andamento':
      return <Badge variant="warning">Em andamento</Badge>;
    case 'aguardando_pecas':
      return <Badge variant="danger">Aguardando peças</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const MaintenanceTable: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/maintenance'],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-800">Manutenções Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 border-b-2 border-gray-200">Placa</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Tipo</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Data</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Status</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-800">Manutenções Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-3 border-b-2 border-gray-200">Placa</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Tipo</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Data</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Status</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Custo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(data || []).slice(0, 4).map((maintenance: any) => (
                <tr key={maintenance.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{maintenance.vehiclePlate}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {maintenance.maintenanceType === 'preventiva' ? 'Preventiva' : 'Corretiva'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{formatDate(maintenance.date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getStatusBadge(maintenance.status as MaintenanceStatusType)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{formatCurrency(maintenance.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <Link href="/maintenance" className="text-sm font-medium text-primary-600 hover:text-primary-800">
            Ver todas as manutenções <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceTable;
