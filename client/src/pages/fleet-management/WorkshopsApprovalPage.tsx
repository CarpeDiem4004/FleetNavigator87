import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

type Workshop = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  cnpj: string;
  created_at: string;
  approval_status: 'pendente' | 'aprovado' | 'rejeitado';
};

export default function WorkshopsApprovalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta para buscar oficinas pendentes
  const { data: workshops, isLoading, error } = useQuery({
    queryKey: ['/api/workshops/pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/workshops/pending');
      return response.json();
    }
  });

  const filteredWorkshops = workshops?.filter((workshop: Workshop) => 
    workshop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.cnpj.includes(searchTerm)
  );

  // Função para aprovar uma oficina
  const handleApprove = async (workshopId: number) => {
    try {
      await apiRequest(`/api/workshops/${workshopId}/approve`, {
        method: 'POST'
      });

      toast({
        title: 'Oficina aprovada com sucesso!',
        description: 'A oficina agora pode acessar o sistema.',
      });

      // Atualiza a lista de oficinas pendentes
      queryClient.invalidateQueries({ queryKey: ['/api/workshops/pending'] });
    } catch (error) {
      toast({
        title: 'Erro ao aprovar oficina',
        description: 'Ocorreu um erro ao aprovar a oficina. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao aprovar oficina:', error);
    }
  };

  // Função para abrir o diálogo de rejeição
  const openRejectDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  // Função para rejeitar uma oficina
  const handleReject = async () => {
    if (!selectedWorkshop) return;
    
    try {
      await apiRequest(`/api/workshops/${selectedWorkshop.id}/reject`, {
        method: 'POST',
        data: { motivo: rejectionReason }
      });

      toast({
        title: 'Oficina rejeitada',
        description: 'A oficina foi rejeitada com sucesso.',
      });

      // Atualiza a lista de oficinas pendentes
      queryClient.invalidateQueries({ queryKey: ['/api/workshops/pending'] });
      setRejectDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar oficina',
        description: 'Ocorreu um erro ao rejeitar a oficina. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Erro ao rejeitar oficina:', error);
    }
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Renderiza badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              Erro ao carregar oficinas. Por favor, tente novamente.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aprovação de Oficinas</CardTitle>
          <CardDescription>
            Gerencie as solicitações de cadastro de oficinas parceiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nome, e-mail ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {filteredWorkshops?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Nenhuma oficina pendente de aprovação encontrada.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data do Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkshops?.map((workshop: Workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell className="font-medium">{workshop.name}</TableCell>
                      <TableCell>{workshop.cnpj}</TableCell>
                      <TableCell>{workshop.email}</TableCell>
                      <TableCell>{workshop.phone}</TableCell>
                      <TableCell>{formatDate(workshop.created_at)}</TableCell>
                      <TableCell>{renderStatusBadge(workshop.approval_status)}</TableCell>
                      <TableCell>
                        {workshop.approval_status === 'pendente' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(workshop.id)}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(workshop)}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Total de solicitações pendentes: {filteredWorkshops?.filter((w: Workshop) => w.approval_status === 'pendente').length || 0}
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo de rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação de oficina</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da rejeição. Esta informação será enviada para a oficina.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}