import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, Search, Plus, KeyRound, FileEdit, 
  Trash2, UserX, UserCircle2, RefreshCw
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NativeSelect } from '@/components/ui/native-select';

// Tipo para usuários
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus';
  baseId: number | null;
  baseName: string | null;
  lastLogin: string | null;
  isActive: boolean;
}

// Dados mockados para a tabela de usuários
// Interface para as bases

// Interface para as bases
interface Base {
  id: number;
  name: string;
  location?: string;
  operation?: string;
  active?: boolean;
  hasMaintenance?: boolean;
  hasTires?: boolean;
  created_at?: string;
}

// Função para traduzir os tipos de perfil
const translateUserRole = (role: string): string => {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    operador: 'Operador',
    oficina: 'Oficina',
    pneus: 'Especialista em Pneus'
  };
  return roles[role] || role;
};

// Função para obter a classe CSS para o badge de perfil
const getRoleBadgeClass = (role: string): string => {
  const classes: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    gestor: 'bg-blue-100 text-blue-800',
    operador: 'bg-green-100 text-green-800',
    oficina: 'bg-amber-100 text-amber-800',
    pneus: 'bg-teal-100 text-teal-800'
  };
  return classes[role] || 'bg-gray-100 text-gray-800';
};

// Função para formatar data e hora
const formatDateTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return 'Nunca';
  const date = new Date(dateTimeString);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

// Função para gerar senha aleatória
const generateRandomPassword = (length: number = 8): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  
  // Garantir pelo menos um caractere de cada categoria
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // minúscula
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // maiúscula
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // número
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // especial
  
  // Preencher o restante da senha aleatoriamente
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Embaralhar a senha para que os caracteres obrigatórios não fiquem sempre nas mesmas posições
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const UsersNew: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'operador',
    baseId: null,
    baseName: null,
    lastLogin: null,
    isActive: true
  });
  
  // Buscar usuários da API
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 10000, // Considerar stale após 10 segundos para permitir atualizações frequentes
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  
  // Buscar bases disponíveis usando React Query
  const { data: bases, isLoading: basesLoading } = useQuery<Base[]>({
    queryKey: ['/api/bases']
  });

  // Filtrar usuários com base no termo de busca
  const filteredUsers = users.filter(
    (user) => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.baseName && user.baseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Atualizar o nome da base ao selecionar uma base
  const handleBaseChange = (baseId: string) => {
    if (baseId === "0") {
      setNewUser({
        ...newUser,
        baseId: null,
        baseName: null
      });
      return;
    }
    
    const id = parseInt(baseId);
    // TypeScript segurança: garantir que bases é um array antes de chamar find
    const base = Array.isArray(bases) ? bases.find(b => b.id === id) : undefined;
    setNewUser({
      ...newUser,
      baseId: id,
      baseName: base?.name || null
    });
  };
  
  // Efeito para invalidar a query de bases quando o modal de adicionar usuário é aberto
  useEffect(() => {
    if (isAddDialogOpen) {
      // Forçar uma atualização da lista de bases quando o modal é aberto
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      
      // Gerar senha aleatória para novo usuário
      const newPassword = generateRandomPassword(10);
      setPassword(newPassword);
      setConfirmPassword(newPassword);
    }
  }, [isAddDialogOpen]);
  
  // Função para visualizar detalhes do usuário
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewUserDialogOpen(true);
  };
  
  // Função para iniciar processo de exclusão do usuário
  const handleDeleteUserConfirm = (userId: number) => {
    setSelectedUserId(userId);
    setIsDeleteUserDialogOpen(true);
  };
  
  // Função para excluir um usuário
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    
    try {
      // Chamar API para excluir o usuário usando apiRequest
      await apiRequest('DELETE', `/api/users/${selectedUserId}`);
      
      // Fechar o diálogo
      setIsDeleteUserDialogOpen(false);
      
      // Atualizar a lista de usuários
      handleUserDataChanged();
      
      toast({
        title: "Usuário excluído",
        description: "Usuário excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao tentar excluir o usuário.",
        variant: "destructive"
      });
    }
  };
  
  // Função para resetar a senha de um usuário
  const handleResetPassword = async () => {
    if (!selectedUserId) return;
    
    try {
      const newPassword = generateRandomPassword(10);
      
      // Chamar API para atualizar a senha do usuário
      const response = await fetch(`/api/users/${selectedUserId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao redefinir senha');
      }
      
      // Fechar o diálogo e mostrar a nova senha
      setIsResetPasswordDialogOpen(false);
      toast({
        title: "Senha redefinida com sucesso",
        description: `A nova senha é: ${newPassword}`,
      });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao tentar redefinir a senha.",
        variant: "destructive"
      });
    }
  };

  // Atualizar lista de usuários após adicionar um novo ou resetar senha
  const handleUserDataChanged = () => {
    // Invalidar a query para forçar uma nova requisição e atualizar os dados
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };

  // Adicionar novo usuário
  const handleAddUser = async () => {
    // Validar dados
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!password) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "A senha é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Processando",
        description: "Criando novo usuário...",
      });
      
      // Fazer a requisição para a API de registro
      // Preparar dados para envio, incluindo baseId se existir
      const registerData: any = {
        username: newUser.email,
        password: password,
        name: newUser.name,
        role: newUser.role
      };
      
      // Adicionar baseId apenas se não for null e maior que 0
      if (newUser.baseId && newUser.baseId > 0) {
        registerData.baseId = newUser.baseId;
        registerData.basename = newUser.baseName;
      }
      
      console.log('Enviando dados de usuário:', { ...registerData, password: '***' });
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar usuário');
      }

      const createdUser = await response.json();
      
      // Limpar o modal e fechar
      setIsAddDialogOpen(false);
      
      // Atualizar a lista de usuários
      handleUserDataChanged();
      
      // Limpar formulário
      setNewUser({
        name: '',
        email: '',
        role: 'operador',
        baseId: null,
        baseName: null,
        lastLogin: null,
        isActive: true
      });
      setPassword('');
      setConfirmPassword('');
      
      // Atualizar lista de bases após adicionar um usuário
      // Isso é útil se o usuário estiver associado a uma nova base
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      
      toast({
        title: "Usuário adicionado",
        description: "Usuário criado com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message || "Ocorreu um erro ao tentar criar o usuário.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Usuários</h1>
            <p className="text-gray-500">
              Gestão de usuários do sistema
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do usuário abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Perfil
                  </Label>
                  <div className="col-span-3">
                    <NativeSelect
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'gestor' | 'operador' | 'oficina' | 'pneus'})}
                      options={[
                        { value: 'admin', label: 'Administrador' },
                        { value: 'gestor', label: 'Gestor' },
                        { value: 'operador', label: 'Operador' },
                        { value: 'oficina', label: 'Oficina' },
                        { value: 'pneus', label: 'Especialista em Pneus' }
                      ]}
                      placeholder="Selecione o perfil"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="base" className="text-right">
                    Base
                  </Label>
                  <div className="col-span-3">
                    {basesLoading ? (
                      <div className="flex items-center justify-center h-10">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                      </div>
                    ) : (
                      <NativeSelect
                        id="base"
                        value={newUser.baseId?.toString() || '0'}
                        onChange={(e) => handleBaseChange(e.target.value)}
                        options={[
                          { value: '0', label: 'Nenhuma (Global)' },
                          ...(bases || []).map(base => ({
                            value: base.id.toString(),
                            label: base.name
                          }))
                        ]}
                        placeholder="Selecione a base (opcional)"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="Senha"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="Confirmar senha"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <NativeSelect
                      id="isActive"
                      value={newUser.isActive ? 'active' : 'inactive'}
                      onChange={(e) => 
                        setNewUser({...newUser, isActive: e.target.value === 'active'})
                      }
                      options={[
                        { value: 'active', label: 'Ativo' },
                        { value: 'inactive', label: 'Inativo' }
                      ]}
                      placeholder="Selecione o status"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Usuários</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar usuários..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de usuários do sistema</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-2" />
                        <span className="text-gray-500">Carregando usuários...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <UserX className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-gray-500">Nenhum usuário encontrado</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {translateUserRole(user.role)}
                        </span>
                      </TableCell>
                      <TableCell>{user.baseName || 'Global'}</TableCell>
                      <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Inativo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setIsResetPasswordDialogOpen(true);
                            }}
                            title="Redefinir senha"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Visualizar detalhes"
                            onClick={() => handleViewUser(user)}
                          >
                            <FileEdit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            title="Excluir usuário"
                            onClick={() => handleDeleteUserConfirm(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Diálogo de redefinição de senha */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja gerar uma nova senha para este usuário?
                A senha atual será perdida e uma nova senha será gerada automaticamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword}>
                Redefinir Senha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de visualização de detalhes do usuário */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Nome:</div>
                  <div className="col-span-2">{selectedUser.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">E-mail:</div>
                  <div className="col-span-2">{selectedUser.email}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Perfil:</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeClass(selectedUser.role)}`}>
                      {translateUserRole(selectedUser.role)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Base:</div>
                  <div className="col-span-2">{selectedUser.baseName || 'Global'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Último acesso:</div>
                  <div className="col-span-2">{formatDateTime(selectedUser.lastLogin) || 'Nunca acessou'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Status:</div>
                  <div className="col-span-2">
                    {selectedUser.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewUserDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de exclusão de usuário */}
        <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este usuário?
                Esta ação não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default UsersNew;