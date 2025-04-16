import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileEdit, Trash2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";

// Tipo para multas
interface Fine {
  id: number;
  vehiclePlate: string;
  driver: string;
  date: string;
  location: string;
  type: string;
  points: number;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'paga' | 'contestada';
  description: string;
}

// Dados mockados para a tabela de multas
const mockFines: Fine[] = [
  {
    id: 1,
    vehiclePlate: 'ABC-1234',
    driver: 'João Silva',
    date: '2025-03-15',
    location: 'Av. Paulista, São Paulo - SP',
    type: 'Excesso de velocidade',
    points: 7,
    amount: 293.47,
    dueDate: '2025-04-15',
    status: 'pendente',
    description: 'Veículo flagrado a 75 km/h em via com limite de 60 km/h'
  },
  {
    id: 2,
    vehiclePlate: 'DEF-5678',
    driver: 'Carlos Santos',
    date: '2025-03-10',
    location: 'Rodovia Anhanguera, Campinas - SP',
    type: 'Ultrapassagem indevida',
    points: 5,
    amount: 195.23,
    dueDate: '2025-04-10',
    status: 'paga',
    description: 'Ultrapassagem em faixa contínua'
  },
  {
    id: 3,
    vehiclePlate: 'GHI-9012',
    driver: 'Marcos Oliveira',
    date: '2025-03-05',
    location: 'Rodovia Presidente Dutra, Rio de Janeiro - RJ',
    type: 'Estacionamento proibido',
    points: 3,
    amount: 88.38,
    dueDate: '2025-04-05',
    status: 'contestada',
    description: 'Veículo estacionado em local proibido durante carga e descarga'
  },
  {
    id: 4,
    vehiclePlate: 'ABC-1234',
    driver: 'João Silva',
    date: '2025-02-28',
    location: 'Av. Brasil, Rio de Janeiro - RJ',
    type: 'Excesso de velocidade',
    points: 7,
    amount: 293.47,
    dueDate: '2025-03-30',
    status: 'paga',
    description: 'Veículo flagrado a 90 km/h em via com limite de 60 km/h'
  },
  {
    id: 5,
    vehiclePlate: 'MNO-7890',
    driver: 'Ana Souza',
    date: '2025-03-20',
    location: 'Av. Rebouças, São Paulo - SP',
    type: 'Avanço de sinal vermelho',
    points: 7,
    amount: 293.47,
    dueDate: '2025-04-20',
    status: 'pendente',
    description: 'Veículo flagrado avançando o sinal vermelho em cruzamento'
  }
];

// Função para traduzir os status de multa
const translateFineStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pendente: 'Pendente',
    paga: 'Paga',
    contestada: 'Contestada'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    paga: 'bg-green-100 text-green-800',
    contestada: 'bg-blue-100 text-blue-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const FinesNew: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>(mockFines);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFine, setNewFine] = useState<Partial<Fine>>({
    vehiclePlate: '',
    driver: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    type: '',
    points: 0,
    amount: 0,
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 dias à frente
    status: 'pendente',
    description: ''
  });

  // Filtrar multas com base no termo de busca
  const filteredFines = fines.filter(
    (fine) => 
      fine.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fine.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar nova multa
  const handleAddFine = () => {
    if (newFine.vehiclePlate && newFine.driver && newFine.type) {
      const fine = {
        ...newFine,
        id: fines.length + 1
      } as Fine;
      
      setFines([...fines, fine]);
      setIsAddDialogOpen(false);
      setNewFine({
        vehiclePlate: '',
        driver: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        type: '',
        points: 0,
        amount: 0,
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'pendente',
        description: ''
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Multas</h1>
            <p className="text-gray-500">
              Gestão de multas de trânsito da frota
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Multa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nova Multa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da multa abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehiclePlate" className="text-right">
                    Placa do Veículo
                  </Label>
                  <Input
                    id="vehiclePlate"
                    value={newFine.vehiclePlate}
                    onChange={(e) => setNewFine({...newFine, vehiclePlate: e.target.value})}
                    className="col-span-3"
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driver" className="text-right">
                    Motorista
                  </Label>
                  <Input
                    id="driver"
                    value={newFine.driver}
                    onChange={(e) => setNewFine({...newFine, driver: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do motorista"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data da Infração
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newFine.date}
                    onChange={(e) => setNewFine({...newFine, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Local
                  </Label>
                  <Input
                    id="location"
                    value={newFine.location}
                    onChange={(e) => setNewFine({...newFine, location: e.target.value})}
                    className="col-span-3"
                    placeholder="Local da infração"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo de Infração
                  </Label>
                  <Input
                    id="type"
                    value={newFine.type}
                    onChange={(e) => setNewFine({...newFine, type: e.target.value})}
                    className="col-span-3"
                    placeholder="Tipo de infração"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="points" className="text-right">
                    Pontos
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={newFine.points}
                    onChange={(e) => setNewFine({...newFine, points: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor (R$)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newFine.amount}
                    onChange={(e) => setNewFine({...newFine, amount: parseFloat(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Data de Vencimento
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newFine.dueDate}
                    onChange={(e) => setNewFine({...newFine, dueDate: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={newFine.status}
                    onValueChange={(value: 'pendente' | 'paga' | 'contestada') => 
                      setNewFine({...newFine, status: value})
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="contestada">Contestada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={newFine.description}
                    onChange={(e) => setNewFine({...newFine, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Detalhes da infração"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddFine}>
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Registro de Multas</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar multas..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Registro de multas da frota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell className="font-medium">{fine.vehiclePlate}</TableCell>
                    <TableCell>{fine.driver}</TableCell>
                    <TableCell>{formatDate(fine.date)}</TableCell>
                    <TableCell>{fine.type}</TableCell>
                    <TableCell>{fine.points}</TableCell>
                    <TableCell>{formatCurrency(fine.amount)}</TableCell>
                    <TableCell>{formatDate(fine.dueDate)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(fine.status)}`}>
                        {translateFineStatus(fine.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon">
                          <FileEdit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default FinesNew;