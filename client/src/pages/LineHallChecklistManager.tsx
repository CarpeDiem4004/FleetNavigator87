import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Search, Eye, CheckSquare, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation } from 'wouter';

interface ChecklistItem {
  id: number;
  driver_name: string;
  vehicle_plate: string;
  checklist_type: string;
  status: 'pendente' | 'concluido';
  created_at: string;
  completed_at?: string;
  items: ChecklistItemDetail[];
}

interface ChecklistItemDetail {
  item: string;
  status: 'ok' | 'problema' | 'nao_verificado';
  observations?: string;
}

const statusLabels = {
  'pendente': { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  'concluido': { label: 'Concluído', className: 'bg-green-100 text-green-800' }
};

const itemStatusLabels = {
  'ok': { label: 'OK', className: 'bg-green-100 text-green-800' },
  'problema': { label: 'Problema', className: 'bg-red-100 text-red-800' },
  'nao_verificado': { label: 'Não Verificado', className: 'bg-gray-100 text-gray-800' }
};

const LineHallChecklistManager: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Buscar todos os checklists
  const { data: checklists = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ['/api/line-hall/checklists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/line-hall/checklists');
      const data = await response.json();
      return data.data || [];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Filtrar checklists
  const filteredChecklists = checklists.filter(checklist => {
    const matchesSearch = !searchTerm || 
      checklist.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || checklist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const viewChecklistDetails = (checklist: ChecklistItem) => {
    setSelectedChecklist(checklist);
    setIsDetailDialogOpen(true);
  };

  const getProblemsCount = (items: ChecklistItemDetail[]) => {
    return items.filter(item => item.status === 'problema').length;
  };

  const getPendingCount = (items: ChecklistItemDetail[]) => {
    return items.filter(item => item.status === 'nao_verificado').length;
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/line-hall-shopee')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Checklists - Line Hall</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os checklists de veículos dos motoristas
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por motorista ou placa..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estatísticas</label>
                <div className="flex space-x-2">
                  <Badge variant="secondary">
                    Total: {filteredChecklists.length}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800">
                    Pendentes: {filteredChecklists.filter(c => c.status === 'pendente').length}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    Concluídos: {filteredChecklists.filter(c => c.status === 'concluido').length}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Checklists */}
        <Card>
          <CardHeader>
            <CardTitle>Checklists dos Motoristas</CardTitle>
            <CardDescription>
              Lista completa de todos os checklists realizados pelos motoristas do Line Hall
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando checklists...</span>
              </div>
            ) : filteredChecklists.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                  {checklists.length === 0 ? 'Nenhum checklist encontrado' : 'Nenhum checklist corresponde aos filtros'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {checklists.length === 0 
                    ? 'Os motoristas ainda não realizaram nenhum checklist.'
                    : 'Tente ajustar os filtros para ver mais resultados.'
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Problemas</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChecklists.map((checklist) => (
                      <TableRow key={checklist.id}>
                        <TableCell className="font-medium">
                          {checklist.driver_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {checklist.vehicle_plate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {checklist.checklist_type.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusLabels[checklist.status].className}>
                            {statusLabels[checklist.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getProblemsCount(checklist.items) > 0 ? (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              {getProblemsCount(checklist.items)} problema(s)
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckSquare className="mr-1 h-3 w-3" />
                              Sem problemas
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(checklist.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                          {checklist.completed_at && (
                            <div className="text-xs text-muted-foreground">
                              Concluído: {format(new Date(checklist.completed_at), 'HH:mm', { locale: ptBR })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewChecklistDetails(checklist)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes do Checklist */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Checklist</DialogTitle>
              <DialogDescription>
                Informações completas do checklist realizado pelo motorista
              </DialogDescription>
            </DialogHeader>
            
            {selectedChecklist && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motorista</label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedChecklist.driver_name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Veículo</label>
                    <p className="text-sm bg-muted p-2 rounded">{selectedChecklist.vehicle_plate}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Checklist</label>
                    <p className="text-sm bg-muted p-2 rounded capitalize">
                      {selectedChecklist.checklist_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Badge className={statusLabels[selectedChecklist.status].className}>
                      {statusLabels[selectedChecklist.status].label}
                    </Badge>
                  </div>
                </div>

                {/* Items do Checklist */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Items Verificados</label>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedChecklist.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.item}
                            </TableCell>
                            <TableCell>
                              <Badge className={itemStatusLabels[item.status].className}>
                                {itemStatusLabels[item.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.observations || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedChecklist.items.filter(item => item.status === 'ok').length}
                    </div>
                    <div className="text-sm text-green-600">Items OK</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {getProblemsCount(selectedChecklist.items)}
                    </div>
                    <div className="text-sm text-red-600">Problemas</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {getPendingCount(selectedChecklist.items)}
                    </div>
                    <div className="text-sm text-gray-600">Não Verificados</div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default LineHallChecklistManager;