import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { RefreshCw, UserPlus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

// Interface para os usuários
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  baseId: number | null;
  basename: string | null;
  is_active: boolean;
  oficina_id: number | null;
};

// Componente inline para spinner
const Spinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }[size];

  return (
    <div className="flex justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-primary ${sizeClass}`}></div>
    </div>
  );
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operador',
    baseId: null as number | null,
  });

  // Buscar a lista de usuários
  const { 
    data: users = [], 
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/users', {
          method: 'GET',
        });
        const data = await response.json();
        console.log('Usuários recebidos:', data);
        return data;
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
      }
    },
    initialData: []
  });

  // Buscar a lista de bases para o select
  const { 
    data: bases = []
  } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/bases', {
          method: 'GET',
        });
        const data = await response.json();
        console.log('Bases recebidas:', data);
        return data;
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        return [];
      }
    },
    initialData: []
  });

  // Mutação para criar um novo usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário foi adicionado ao sistema",
        variant: "default",
      });
      setIsCreateUserOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'operador',
        baseId: null,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: `Ocorreu um erro: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar um usuário
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas",
        variant: "default",
      });
      setIsEditUserOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: `Ocorreu um erro: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para excluir um usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/users/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído com sucesso",
        description: "O usuário foi removido do sistema",
        variant: "default",
      });
      setIsDeleteUserOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: `Ocorreu um erro: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Filtra os usuários com base no termo de pesquisa
  const filteredUsers = users?.filter((user: User) => {
    if (!user) return false;
    
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const role = user.role?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    
    return name.includes(term) || 
           email.includes(term) || 
           role.includes(term);
  });

  // Função para abrir o modal de criação de usuário
  const openCreateUserDialog = () => {
    setIsCreateUserOpen(true);
  };

  // Função para abrir o modal de edição de usuário
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  // Função para abrir o modal de exclusão de usuário
  const openDeleteUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  // Função para lidar com a mudança nos campos do formulário de criação
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para lidar com a mudança nos campos do formulário de edição
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;

    const { name, value } = e.target;
    setSelectedUser(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  // Função para lidar com a mudança de perfil no select
  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({
      ...prev,
      role: value
    }));
  };

  // Função para lidar com a mudança de perfil no select para edição
  const handleEditRoleChange = (value: string) => {
    if (!selectedUser) return;
    
    setSelectedUser(prev => ({
      ...prev!,
      role: value
    }));
  };

  // Função para lidar com a mudança de base no select
  const handleBaseChange = (value: string) => {
    setNewUser(prev => ({
      ...prev,
      baseId: value === "null" ? null : parseInt(value)
    }));
  };

  // Função para lidar com a mudança de base no select para edição
  const handleEditBaseChange = (value: string) => {
    if (!selectedUser) return;
    
    setSelectedUser(prev => ({
      ...prev!,
      baseId: value === "null" ? null : parseInt(value)
    }));
  };

  // Função para enviar o formulário de criação
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  // Função para enviar o formulário de edição
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    updateUserMutation.mutate(selectedUser);
  };

  // Função para confirmar a exclusão de usuário
  const handleDeleteUserConfirm = () => {
    if (!selectedUser) return;
    
    deleteUserMutation.mutate(selectedUser.id);
  };

  // Função para obter uma tradução amigável para os papéis
  const getRoleTranslation = (role: string): string => {
    const translations: Record<string, string> = {
      'admin': 'Administrador',
      'gestor': 'Gestor',
      'operador': 'Operador',
      'oficina': 'Oficina',
      'pneus': 'Gestor de Pneus',
      'posto': 'Posto',
      'gestor_frota': 'Gestor de Frota'
    };
    
    return translations[role] || role;
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Gerencie os usuários do sistema</CardDescription>
            </div>
            <Button onClick={openCreateUserDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="w-1/3">
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-red-500">
              <AlertCircle className="h-10 w-10 mx-auto mb-2" />
              <p>Erro ao carregar usuários.</p>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleTranslation(user.role)}</TableCell>
                      <TableCell>{user.basename || '-'}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Inativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditUserDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteUserDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
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
            Total de usuários: {filteredUsers?.length || 0}
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar Lista
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de criação de usuário */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUserSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleCreateInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleCreateInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleCreateInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Perfil
                </Label>
                <Select 
                  value={newUser.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="pneus">Gestor de Pneus</SelectItem>
                    <SelectItem value="posto">Posto</SelectItem>
                    <SelectItem value="gestor_frota">Gestor de Frota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="baseId" className="text-right">
                  Base
                </Label>
                <Select 
                  value={newUser.baseId?.toString() || "null"}
                  onValueChange={handleBaseChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Nenhuma base</SelectItem>
                    {bases.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>
                        {base.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateUserOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Salvando...</span>
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de usuário */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário conforme necessário.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUserSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={selectedUser.name}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Perfil
                  </Label>
                  <Select 
                    value={selectedUser.role}
                    onValueChange={handleEditRoleChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="pneus">Gestor de Pneus</SelectItem>
                      <SelectItem value="posto">Posto</SelectItem>
                      <SelectItem value="gestor_frota">Gestor de Frota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-baseId" className="text-right">
                    Base
                  </Label>
                  <Select 
                    value={selectedUser.baseId?.toString() || "null"}
                    onValueChange={handleEditBaseChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione uma base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Nenhuma base</SelectItem>
                      {bases.map((base: any) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-status" className="text-right">
                    Status
                  </Label>
                  <Select 
                    value={selectedUser.is_active ? "active" : "inactive"}
                    onValueChange={(value) => {
                      setSelectedUser({
                        ...selectedUser,
                        is_active: value === "active"
                      });
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditUserOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <Spinner size="sm" />
                      <span className="ml-2">Salvando...</span>
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="mb-2">Você está prestes a excluir o usuário:</p>
              <div className="bg-secondary p-3 rounded-md">
                <p><strong>Nome:</strong> {selectedUser.name}</p>
                <p><strong>E-mail:</strong> {selectedUser.email}</p>
                <p><strong>Perfil:</strong> {getRoleTranslation(selectedUser.role)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteUserOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteUserConfirm}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Excluindo...</span>
                </>
              ) : (
                'Excluir Usuário'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}