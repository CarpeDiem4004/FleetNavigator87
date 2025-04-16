import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Truck, 
  Wrench, 
  Fuel, 
  FileWarning, 
  MapPin,
  AlertCircle
} from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';

// Tipo para item de manutenção na tabela
interface MaintenanceItem {
  id: number;
  vehiclePlate: string;
  type: 'preventiva' | 'corretiva';
  description: string;
  date: string;
  status: 'concluida' | 'em_andamento' | 'aguardando_pecas';
}

// Dados mockados para a tabela de manutenções
const pendingMaintenance: MaintenanceItem[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    type: 'preventiva',
    description: 'Troca de óleo e filtros',
    date: '2025-04-18',
    status: 'em_andamento'
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    type: 'corretiva',
    description: 'Reparo do sistema de freios',
    date: '2025-04-16',
    status: 'aguardando_pecas'
  },
  {
    id: 3,
    vehiclePlate: 'GHI-9012',
    type: 'corretiva',
    description: 'Substituição da embreagem',
    date: '2025-04-17',
    status: 'em_andamento'
  },
  {
    id: 4,
    vehiclePlate: 'JKL-3456',
    type: 'preventiva',
    description: 'Alinhamento e balanceamento',
    date: '2025-04-19',
    status: 'em_andamento'
  }
];

// Dados estatísticos para os cards
const stats = {
  totalVehicles: 32,
  vehiclesInOperation: 27,
  vehiclesInMaintenance: 5,
  pendingMaintenance: 8,
  activeTires: 180,
  fuelConsumed: 5250
};

// Função para traduzir os tipos de manutenção
const translateMaintenanceType = (type: string): string => {
  const types: Record<string, string> = {
    preventiva: 'Preventiva',
    corretiva: 'Corretiva'
  };
  return types[type] || type;
};

// Função para traduzir os status de manutenção
const translateMaintenanceStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    concluida: 'Concluída',
    em_andamento: 'Em Andamento',
    aguardando_pecas: 'Aguardando Peças'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    concluida: 'bg-green-100 text-green-800',
    em_andamento: 'bg-yellow-100 text-yellow-800',
    aguardando_pecas: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Componente para o card de estatística
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, color }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`rounded-full p-2 ${color}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const DashboardNew: React.FC = () => {
  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500">
            Visão geral da frota e operações
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total de Veículos"
            value={stats.totalVehicles}
            icon={<Truck className="h-4 w-4 text-blue-700" />}
            description="Veículos cadastrados na frota"
            color="bg-blue-100"
          />
          <StatCard
            title="Em Operação"
            value={stats.vehiclesInOperation}
            icon={<Truck className="h-4 w-4 text-green-700" />}
            description="Veículos atualmente em operação"
            color="bg-green-100"
          />
          <StatCard
            title="Em Manutenção"
            value={stats.vehiclesInMaintenance}
            icon={<Wrench className="h-4 w-4 text-yellow-700" />}
            description="Veículos em manutenção"
            color="bg-yellow-100"
          />
          <StatCard
            title="Manutenções Pendentes"
            value={stats.pendingMaintenance}
            icon={<AlertCircle className="h-4 w-4 text-red-700" />}
            description="Manutenções agendadas ou em andamento"
            color="bg-red-100"
          />
          <StatCard
            title="Pneus Ativos"
            value={stats.activeTires}
            icon={<MapPin className="h-4 w-4 text-purple-700" />}
            description="Pneus em uso ou em estoque"
            color="bg-purple-100"
          />
          <StatCard
            title="Combustível (L)"
            value={stats.fuelConsumed.toLocaleString('pt-BR')}
            icon={<Fuel className="h-4 w-4 text-orange-700" />}
            description="Litros consumidos no mês"
            color="bg-orange-100"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manutenções Pendentes</CardTitle>
            <CardDescription>
              Manutenções programadas e em andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de manutenções pendentes</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingMaintenance.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.vehiclePlate}</TableCell>
                    <TableCell>{translateMaintenanceType(item.type)}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(item.status)}`}>
                        {translateMaintenanceStatus(item.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default DashboardNew;