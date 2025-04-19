import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TripStatusType = 'programada' | 'carregando' | 'aguardando_carga' | 'em_transito' | 'finalizada';

const getStatusBadge = (status: TripStatusType) => {
  switch (status) {
    case 'programada':
      return <Badge variant="purple">Programada</Badge>;
    case 'carregando':
      return <Badge variant="info">Carregando</Badge>;
    case 'aguardando_carga':
      return <Badge variant="warning">Aguardando carga</Badge>;
    case 'em_transito':
      return <Badge variant="success">Em trânsito</Badge>;
    case 'finalizada':
      return <Badge variant="secondary">Finalizada</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const LineHallTable: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/line-hall'],
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-800">Line Hall - Status de Viagens</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-3 border-b-2 border-gray-200">Composição</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Carregamento</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Destino</th>
                  <th className="px-3 py-3 border-b-2 border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Skeleton className="h-5 w-24 rounded-full" />
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
        <CardTitle className="text-lg font-medium text-gray-800">Line Hall - Status de Viagens</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-3 border-b-2 border-gray-200">Composição</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Carregamento</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Destino</th>
                <th className="px-3 py-3 border-b-2 border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(data || []).slice(0, 4).map((trip: any) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {trip.truckPlate} + {trip.trailer1Plate} {trip.trailer2Plate && `+ ${trip.trailer2Plate}`}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{formatDateTime(trip.loadingTime)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{trip.destination}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getStatusBadge(trip.tripStatus as TripStatusType)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <Link href="/line-hall" className="text-sm font-medium text-primary-600 hover:text-primary-800">
            Ver todos os Line Hall <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LineHallTable;
