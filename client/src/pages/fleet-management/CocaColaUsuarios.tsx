import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Users, Plus, Edit, Trash2, ArrowLeft, Loader2, Building2, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CocaColaUser {
  id: number;
  email: string;
  nome: string;
  base_id: number | null;
  tipo: string;
  ativo: boolean;
  created_at: string;
  last_login: string | null;
  base_nome: string | null;
  cidade: string | null;
  estado: string | null;
}

interface CocaColaBase {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
}

export default function CocaColaUsuarios() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<CocaColaUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    base_id: '',
    tipo: 'operador',
    ativo: true
  });

  const { data: users = [], isLoading } = useQuery<CocaColaUser[]>({
    queryKey: ['/api/coca-cola/users']
  });

  const { data: bases = [] } = useQuery<CocaColaBase[]>({
    queryKey: ['/api/coca-cola/all-bases']
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/coca-cola/auth/register', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/users'] });
      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso!' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao criar usuário', 
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/coca-cola/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/users'] });
      toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso!' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao atualizar usuário', 
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/coca-cola/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coca-cola/users'] });
      toast({ title: 'Sucesso', description: 'Usuário deletado com sucesso!' });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Erro ao deletar usuário', 
        variant: 'destructive' 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      confirmPassword: '',
      base_id: '',
      tipo: 'operador',
      ativo: true
    });
    setEditingUser(null);
    setShowDialog(false);
  };

  const handleEdit = (user: CocaColaUser) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      password: '',
      confirmPassword: '',
      base_id: user.base_id?.toString() || '',
      tipo: user.tipo || 'operador',
      ativo: user.ativo
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.email) {
      toast({ title: 'Erro', description: 'Nome e e-mail são obrigatórios', variant: 'destructive' });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({ title: 'Erro', description: 'Senha é obrigatória para novos usuários', variant: 'destructive' });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ title: 'Erro', description: 'Senhas não conferem', variant: 'destructive' });
      return;
    }

    const payload: any = {
      nome: formData.nome,
      email: formData.email,
      base_id: formData.base_id ? parseInt(formData.base_id) : null,
      tipo: formData.tipo,
      ativo: formData.ativo
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { label: string; className: string }> = {
      'admin': { label: 'Administrador', className: 'bg-purple-500' },
      'operador': { label: 'Operador', className: 'bg-blue-500' },
      'base': { label: 'Base', className: 'bg-green-500' }
    };
    const item = config[tipo] || { label: tipo, className: 'bg-gray-500' };
    return <Badge className={item.className}>{item.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/fleet-management/coca-cola')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-red-600" />
                Usuários Coca-Cola
              </h1>
              <p className="text-gray-500">Gestão de usuários do sistema</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowDialog(true)} 
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>{users.length} usuários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getTipoBadge(user.tipo)}</TableCell>
                    <TableCell>
                      {user.base_nome ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.base_nome}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Global
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.ativo ? 'default' : 'secondary'}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca acessou'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setDeleteConfirmId(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do usuário abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="Nome do usuário"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Base</Label>
              <Select
                value={formData.base_id}
                onValueChange={(v) => setFormData({ ...formData, base_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (Global)</SelectItem>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.nome} - {base.cidade}/{base.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.ativo ? 'ativo' : 'inativo'}
                onValueChange={(v) => setFormData({ ...formData, ativo: v === 'ativo' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingUser ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
